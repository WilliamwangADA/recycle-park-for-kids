#!/bin/bash
cd "$(dirname "$0")"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
PORT=8080
echo ""
echo "  📱 在 iPad 上用 Safari 打开下面这个网址："
echo "  （iPad 要和这台 Mac 连同一个 WiFi）"
echo ""
echo "      http://$IP:$PORT"
echo ""
echo "  打开后：点 Safari 右上角「分享」→「添加到主屏幕」，"
echo "  桌面就会出现「回收乐园」App 图标，点开就是全屏游戏！"
echo ""
echo "  （玩的时候别关这个黑窗口；玩完按 Ctrl+C 或直接关掉即可）"
echo ""
python3 -m http.server $PORT
