import modal
from fastapi import Response, HTTPException, Query, Request
from datetime import datetime, timezone
import requests
import os 
import io


modal_token = os.getenv("MODAL_TOKEN")

def download_model():
    from diffusers import AutoPipelineForText2Image
    import torch

    AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16"
    )

image = (modal.Image.debian_slim()
        .pip_install("fastapi[standard]", "transformers", "accelerate", "diffusers", "requests")
        .run_function(download_model))

app = modal.App("sd-demo", image=image) # Create an app with name

@app.cls(
        image=image,
        gpu="A10G",
        container_idle_timeout=300, # Specify to keep it on for 5 minutes after last use, helps with the keep_warm function
        secrets=[modal.Secret.from_name("API_KEY")]
) 
class Model:
    @modal.build()
    @modal.enter()
    def load_weights(self):
        from diffusers import AutoPipelineForText2Image
        import torch

        self.pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16"
    )

        self.pipe.to("cuda")
        self.API_KEY = os.environ["API_KEY"]

    @modal.web_endpoint() # Annotate as a web endpoint, our image is going to be generated an is going to be displayed through a URL so we need to create an endpoint 
    def generate(self, request: Request, prompt: str = Query(..., description="The prompt for image generation")): 
        api_key = request.headers.get("X-API-KEY")
        if api_key != self.API_KEY: #If the api key sent in the request header does not match the API KEY I set then we will through an error
            raise HTTPException(
                status_code=401,
                detail="Unauthorized"
            )

        image = self.pipe(prompt=prompt, num_inference_steps=1, guidance_scale=0.0).images[0] 

        buffer = io.BytesIO() # We need to load the image into memory so we can return it into the request
        image.save(buffer, format="JPEG") 

        return Response(content=buffer.getvalue(), media_type="image/jpeg")
    @modal.web_endpoint() # Create a health point
    def health(self):
        """Lightwight endpoint for keeping the container warm"""
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Cron job that pings your API endpoint so it never spins down, helps with execution time
# Ensures that the container never spins down
@app.function(
    schedule=modal.Cron("*/5 * * * *"),
    secrets=(modal.Secret.from_name("API_KEY"))
)

def keep_warm():
    health_url = "https://j00961010--sd-demo-model-health.modal.run"
    generate_url = "https://j00961010--sd-demo-model-generate.modal.run"

    # First check the health endpoint 
    health_response = requests.get(health_url)
    print(f"Health check at: {health_response.json()['timestamp']}")

    # Then make a test request to generate endpoint with API key
    headers = {"X-API-KEY": os.environ["API_KEY"]}
    generate_response = requests.get(generate_url, headers=headers)
    print(f"Generate endpoint tested successfully at: {datetime.now(timezone.utc).isoformat}")