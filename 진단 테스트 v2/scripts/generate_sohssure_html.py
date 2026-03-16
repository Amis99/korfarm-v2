import json
import os

INPUT_FILE = os.path.join(os.path.dirname(__file__), '../output/final_sohssure_level1.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../output/sohssure_level1_final_paper.html')

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Sohssure Level 1 Diagnostic Test</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 210mm; /* A4 Width */
            margin: 0 auto;
            padding: 20mm;
            background: #fff;
            color: #333;
        }
        
        h1 {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .passage-section {
            margin-bottom: 40px;
            page-break-after: always;
        }
        
        .passage-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 5px 10px;
            background: #f5f5f5;
            border-left: 5px solid #555;
        }
        
        .passage-content {
            background: #fafafa;
            padding: 20px;
            border: 1px solid #ddd;
            margin-bottom: 25px;
            white-space: pre-wrap;
            font-size: 1.05em;
            line-height: 1.8;
        }
        
        .questions-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .question-box {
            margin-bottom: 15px;
            break-inside: avoid;
        }
        
        .q-stem {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .choices {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 0.95em;
        }
        
        .choice-item {
            margin-bottom: 4px;
        }
        
        .circled-num {
            display: inline-block;
            width: 1.2em;
            font-weight: normal;
        }
        
        @media print {
            body { max-width: none; padding: 0; }
            .passage-section { page-break-after: always; }
        }
    </style>
</head>
<body>
    <h1>소쉬르(Sohssure) 레벨 1 진단평가</h1>
    
    <div style="text-align: center; margin-bottom: 30px;">
        <span style="margin-right: 20px;">학년: ________________</span>
        <span>이름: ________________</span>
    </div>

    <!-- Passages -->
    {content}

</body>
</html>
"""

def circled(idx):
    return ["①", "②", "③", "④", "⑤"][idx]

def generate_html():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    content_html = ""
    
    for i, p in enumerate(data['passages']):
        # Section Header
        grade_text = f"초등학교 {p['grade']}학년 수준"
        genre_text = "문학" if p['genre'] == 'lit' else "비문학"
        
        content_html += f"""
        <div class="passage-section">
            <div class="passage-title">
                [지문 {i+1}] {grade_text} - {genre_text}
            </div>
            
            <div class="passage-content">{p['content']}</div>
            
            <div class="questions-container">
        """
        
        for q in p['questions']:
            q_html = f"""
                <div class="question-box">
                    <div class="q-stem">{q['global_number']}. {q['question']['stem']}</div>
                    <ul class="choices">
            """
            
            for c_idx, choice in enumerate(q['choices']):
                q_html += f"""
                        <li class="choice-item">
                            <span class="circled-num">{circled(c_idx)}</span> {choice['text']}
                        </li>
                """
            
            q_html += """
                    </ul>
                </div>
            """
            content_html += q_html
            
        content_html += """
            </div> <!-- questions-container -->
        </div> <!-- passage-section -->
        """
        
    final_html = HTML_TEMPLATE.replace("{content}", content_html)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_html)
        
    print(f"Generated HTML to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_html()
