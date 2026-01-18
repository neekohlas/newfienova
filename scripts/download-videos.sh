#!/bin/bash
# Download missing videos from Blogger

VIDEO_DIR="/Users/nicohenry/Library/CloudStorage/GoogleDrive-nickhhenry@gmail.com/My Drive/Maritime Blog/videos"

echo "=== Downloading missing videos from Blogger ==="
echo "Videos will be saved to: $VIDEO_DIR"
echo ""

# Function to get video URL and download
download_video() {
    local token="$1"
    local filename="$2"
    local description="$3"

    echo "Fetching: $description"

    # Get the page and extract the play_url for itag=18 (better quality mp4)
    local url=$(curl -s "https://www.blogger.com/video.g?token=$token" | \
        python3 -c "import sys,json,re; m=re.search(r'VIDEO_CONFIG = ({.*?})\s*$', sys.stdin.read(), re.M); d=json.loads(m.group(1)) if m else {}; urls=[s['play_url'] for s in d.get('streams',[]) if s.get('format_id')==18]; print(urls[0] if urls else '')" 2>/dev/null)

    if [ -z "$url" ]; then
        echo "  ERROR: Could not extract video URL"
        return 1
    fi

    echo "  Downloading to $filename..."
    curl -L -o "$VIDEO_DIR/$filename" "$url"

    if [ -f "$VIDEO_DIR/$filename" ]; then
        echo "  SUCCESS: Downloaded $(ls -lh "$VIDEO_DIR/$filename" | awk '{print $5}')"
    else
        echo "  ERROR: Download failed"
    fi
    echo ""
}

# Video Blog - Video 2 (campsite search) - we already have videoblog1.mov
download_video "AD6v5dwqjFR-SxSChdkV3Wn1rP1a4U-OxTxrKzVTptkM7syCT82Pj-fS4keXfEyzmRXeJRsoGn_aQUI_f2WaC2WLOyTjocIWSudfhW1OSOi_Cwq_57Q6axlQUFgZVHDsCITTXV2pX6dy" \
    "videoblog2.mp4" \
    "Video Blog - Campsite search video"

# The Choice Was Clear - Ferry video
download_video "AD6v5dyyeV8BreDQU0RRKCA1MTwWBaGW5SNQ9QlFEMMjLURoYP3l_ZFD_5DKChT4pedvneps4HFK2Ucgfwg0b9Zw5BxdggXRn_sMAgCdaPuOXoWL5CNA5QBD_5VjcE46n8qUZ5cAGcdh" \
    "ferry.mp4" \
    "The Choice Was Clear - Ferry video"

# The Long And Lonely Road - Burgeo Road video
download_video "AD6v5dyfcHpjbkwdnGoLXfNcx1pOJndRgJfjN5WCQeq2VQDaUrlaTL_zWWl0IUdxzWLcZKTjIQ9Tq5SMoRyV-OZYwv6ATReAJlOx0_ki_WhZwhgUHGam9jM0NPOz_fVOcw97LurGW04" \
    "burgeo_road.mp4" \
    "The Long And Lonely Road - Burgeo Road video"

# Sou'western Coast - Additional video (unintelligible man)
download_video "AD6v5dz6Io0u5z3vfnuHR8MbXzkZD8i-tnJ-oZZQAUHq2hD9eonmYO4tn9HTlPiNW3scMIen6H6GqYiyOTjwMRTZ6KrRu_jlBtBxsiZ5BDC7Q-PuneRcZjXd2bAKpKW2QVT-qADKSeI" \
    "swcoast2.mp4" \
    "Sou'western Coast - Newfie accent video"

echo "=== Done ==="
echo "Check $VIDEO_DIR for downloaded files"
