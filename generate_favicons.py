#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_favicons.py - Gerador de Favicons Oficiais do IF Baiano para o Mural Digital
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')

PASTA_PROJETO = Path(__file__).parent
PASTA_ASSETS = PASTA_PROJETO / 'assets'
PASTA_ASSETS.mkdir(exist_ok=True)

# SVG do Logotipo Simbólico do IF Baiano
SVG_CONTENT = """<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="14" height="14" rx="3" fill="#13884D"/>
  <rect x="22" y="4" width="14" height="14" rx="3" fill="#13884D"/>
  <rect x="4" y="22" width="14" height="14" rx="3" fill="#C8191E"/>
  <rect x="22" y="22" width="14" height="14" rx="3" fill="#13884D"/>
</svg>
"""

def criar_imagem_base(size=256):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = int(size * 0.1)
    gap = int(size * 0.08)
    rect_w = int((size - 2 * margin - gap) / 2)

    c_green = (19, 136, 77, 255)
    c_red = (200, 25, 30, 255)
    radius = int(size * 0.05)

    # Quadrante 1 (Topo Esquerdo - Verde)
    draw.rounded_rectangle([margin, margin, margin + rect_w, margin + rect_w], radius=radius, fill=c_green)
    # Quadrante 2 (Topo Direito - Verde)
    draw.rounded_rectangle([margin + rect_w + gap, margin, margin + 2 * rect_w + gap, margin + rect_w], radius=radius, fill=c_green)
    # Quadrante 3 (Inferior Esquerdo - Vermelho Fruto)
    draw.rounded_rectangle([margin, margin + rect_w + gap, margin + rect_w, margin + 2 * rect_w + gap], radius=radius, fill=c_red)
    # Quadrante 4 (Inferior Direito - Verde)
    draw.rounded_rectangle([margin + rect_w + gap, margin + rect_w + gap, margin + 2 * rect_w + gap, margin + 2 * rect_w + gap], radius=radius, fill=c_green)

    return img

def main():
    print('[INICIANDO] Geração dos favicons do Mural Digital IF Baiano...')

    # 1. Salvar SVG
    svg_path = PASTA_ASSETS / 'favicon.svg'
    svg_path.write_text(SVG_CONTENT, encoding='utf-8')
    print(f'[OK] Criado: {svg_path}')

    # 2. Criar Imagem Base PNG 256x256
    base_img = criar_imagem_base(256)

    # 3. Salvar favicon.png (32x32) e png de alta resolução (98x98, 192x192)
    png_path = PASTA_ASSETS / 'favicon.png'
    resized_32 = base_img.resize((32, 32), Image.Resampling.LANCZOS)
    resized_32.save(png_path, format='PNG')
    print(f'[OK] Criado: {png_path}')

    png_98_path = PASTA_ASSETS / 'favicon-98x98.png'
    resized_98 = base_img.resize((98, 98), Image.Resampling.LANCZOS)
    resized_98.save(png_98_path, format='PNG')
    print(f'[OK] Criado: {png_98_path}')

    # 4. Salvar favicon.ico
    ico_path = PASTA_ASSETS / 'favicon.ico'
    ico_base = base_img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_base.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'[OK] Criado: {ico_path}')

    print('[SUCESSO] Todos os favicons foram gerados em assets/')

if __name__ == '__main__':
    main()
