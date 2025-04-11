from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import httpx

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
async def login(request: Request):
    form_data = await request.form()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/auth/login", 
            data={
                "username": form_data["username"],
                "password": form_data["password"]
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Login failed")
        return response.json()

@router.post("/signup") 
async def signup(request: Request):
    form_data = await request.form()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/auth/signup",
            data={
                "username": form_data["username"],
                "password": form_data["password"],
                "email": form_data.get("email", "")
            }
        )
        if response.status_code != 201:
            raise HTTPException(status_code=400, detail="Signup failed")
        return response.json()
