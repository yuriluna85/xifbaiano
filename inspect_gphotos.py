import urllib.request
import re

url = "https://photos.google.com/share/AF1QipN7yS4t0-hKAdpcBkTsApazRMYKOj2OS99qMZJjDbWiYwlmbpFym6WdqsCQ18uC3g/photo/AF1QipMLFK8TUvBy97WJFVj-a8bbXUpM3SNqILtSopfz?key=ZF9fWWdPbGZncGU4SVNXTXRTeWlzSmpLS0F5MlFB"

req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        og_video = re.findall(r'property="og:video[^"]*" content="([^"]+)"', html)
        og_image = re.findall(r'property="og:image[^"]*" content="([^"]+)"', html)
        video_urls = re.findall(r'https://video-downloads\.googleusercontent\.com/[^\s"\'<>]+', html)
        googleusercontent = re.findall(r'https://lh3\.googleusercontent\.com/[^\s"\'<>]+', html)
        video_sources = re.findall(r'https://[^\s"\'<>]+\.mp4[^\s"\'<>]*', html)
        
        print("OG Video:", og_video)
        print("OG Image:", og_image[:2] if og_image else "Nenhum")
        print("Video downloads URLs:", video_urls[:2] if video_urls else "Nenhum")
        print("Googleusercontent count:", len(googleusercontent))
        print("Direct MP4 URLs:", video_sources[:2] if video_sources else "Nenhum")

except Exception as e:
    print("Erro ao acessar URL:", e)
