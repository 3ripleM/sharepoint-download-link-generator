import requests

url_PKL = "https://uwin365.sharepoint.com/:u:/s/cshfrg-ReviewAnalysis/EYwH_Bqd4VFCgoiYNVCLAD4BH-h2xEGLGHaStE1_Nl9FkQ?e=5JoiGq"
url_ZIP = "https://uwin365.sharepoint.com/:f:/s/cshfrg-TeamFormation/Egwn-uzzJtNEsTM3cKOpM2gBQpcF3_qrZcs-DzIg_j7hsg"
url_JSON = "https://uwin365.sharepoint.com/:u:/s/cshfrg-ReviewAnalysis/EXfs1j6cAL9Gjmqu2Hysl4wBTl2M-ow7NzfBsByu-MN2cA?e=93ac2S"

def download_from_sharepoint_by_url(url: str) -> None:
  download_link_obj = requests.post("http://localhost:3000/download", {"url": url})

  obj_ = download_link_obj.json()

  if obj_["METHOD"] == "GET":
    resp = requests.get(obj_["url"], headers=obj_["headers"])
    filename = resp.headers["Content-Disposition"].split(";")[-1].split("=")[-1].replace('"', '')
    open(filename, 'wb').write(resp.content)
  
  if obj_["METHOD"] == "POST":
    resp = requests.post(obj_["url"], headers=obj_["headers"], data=obj_["postData"])
    filename = obj_["postData"]["zipFileName"].replace('"', '')
    open(filename, 'wb').write(resp.content)


download_from_sharepoint_by_url(url_JSON)


