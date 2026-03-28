import base64, requests

with open("data/12830.png", "rb") as f:
    b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()

r = requests.post("http://localhost:5000/recognize", json={"image": b64})
print(r.status_code)
print(r.json())
