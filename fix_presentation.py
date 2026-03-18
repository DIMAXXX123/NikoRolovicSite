import re

with open('presentation/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Map slide numbers to screenshot files
slide_map = {
    'SLIDE 6': 'register.jpg',
    'SLIDE 9': 'login.jpg', 
    'SLIDE 12': 'news.jpg',
    'SLIDE 13': 'lectures-subjects.jpg',
    'SLIDE 14': 'lecture-view.jpg',
    'SLIDE 17': 'calendar.jpg',
    'SLIDE 19': 'schedule-weekly.jpg',
    'SLIDE 20': 'schedule-daily.jpg',
    'SLIDE 22': 'grades.jpg',
    'SLIDE 24': 'profile.jpg',
    'SLIDE 28': 'settings.jpg',
    'SLIDE 34': 'lecture-view.jpg',
    'SLIDE 38': 'news.jpg',
}

# Find each screenshot-placeholder div and replace its content
# Pattern: <div class="phone-screen screenshot-placeholder">...multiline content...</div> (closed at proper depth)
img_tag = '<img src="screenshots/{img}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">'

lines = content.split('\n')
result = []
i = 0
current_slide = 'INTRO'
skip_depth = 0
skipping = False
replacement_img = None

while i < len(lines):
    line = lines[i]
    
    # Track current slide
    m = re.search(r'<!-- (SLIDE \d+)', line)
    if m:
        current_slide = m.group(1)
    
    if skipping:
        opens = len(re.findall(r'<div', line))
        closes = len(re.findall(r'</div>', line))
        skip_depth += opens - closes
        if skip_depth <= 0:
            skipping = False
        i += 1
        continue
    
    if 'screenshot-placeholder' in line:
        img = slide_map.get(current_slide, 'news.jpg')
        result.append(f'            <div class="phone-screen"><img src="screenshots/{img}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>')
        # Count opens/closes on this line to see if we need to skip
        opens = len(re.findall(r'<div', line))
        closes = len(re.findall(r'</div>', line))
        depth = opens - closes
        if depth > 0:
            skipping = True
            skip_depth = depth
        print(f'Replaced {current_slide} -> {img}')
        i += 1
        continue
    
    result.append(line)
    i += 1

new_content = '\n'.join(result)

# Set Reveal.js to 16:9 desktop - find Reveal.initialize and add width/height
if 'width:' not in new_content.split('Reveal.initialize')[1][:200] if 'Reveal.initialize' in new_content else True:
    new_content = new_content.replace(
        'Reveal.initialize({',
        'Reveal.initialize({\n      width: 1920,\n      height: 1080,'
    )
    print('Set 16:9 desktop resolution')

remaining = new_content.count('screenshot-placeholder')
print(f'Remaining placeholders: {remaining}')

with open('presentation/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done!')
