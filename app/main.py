from fastapi import FastAPI

app = FastAPI(title="Instagram Clone API")


@app.get("/")
def home():
    return {"message": "Instagram Clone API is running!"}