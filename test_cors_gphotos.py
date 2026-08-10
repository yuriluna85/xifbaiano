import urllib.request
import urllib.parse
import re

target = "https://photos.google.com/share/AF1QipN7yS4t0-hKAdpcBkTsApazRMYKOj2OS99qMZJjDbWiYwlmbpFym6WdqsCQ18uC3g/photo/AF1QipMLFK8TUvBy97WJFVj-a8bbXUpM3SNqILtSopfz?key=ZF9fWWdPbGZncGU4SVNXTXRTeWlzSmpLS0F5MlFB"
proxy_url = "https://api.allorigins.win/raw?url=" + urllib.parse.quote(target)

req = urllib.request.Request(proxy_url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        video_urls = re.findall(r'https://video-downloads\.googleusercontent\.com/[^\s"\'<>]+', html)
        print("Sucesso! Links de vídeo encontrados:", len(video_urls))
        if video_urls:
            print("URL do MP4 direto:", video_urls[0][:120] + "...")
except Exception as e:
    print("Erro no teste:", e)
