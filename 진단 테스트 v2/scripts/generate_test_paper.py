import os
import json
import argparse
from glob import glob

HTML_HEADER = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>국어농장 진단 테스트 - {title}</title>
    <!-- Paged.js from CDN -->
    <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
    <style>
        :root {{
            --color-primary: #1A365D;
            --color-secondary: #2B6CB0;
            --color-accent: #DD6B20;
            --color-light-blue: #EBF4FF;
            --color-light-yellow: #FEFCE8;
            --color-light-green: #F0FDF4;
            --color-border: #E2E8F0;
            --color-text: #1A202C;
        }}

        /* Paged.js Print Styles for A4 */
        @page {{
            size: A4;
            margin: 20mm 15mm 25mm;
            @bottom-center {{
                content: "Page " counter(page) " of " counter(pages);
                font-family: "Noto Sans KR", sans-serif;
                font-size: 10pt;
            }}
        }}

        /* Base Body Style */
        body {{
            font-family: "Noto Serif KR", serif;
            font-size: 11pt;
            line-height: 1.6;
            color: var(--color-text);
            background: white;
        }}

        /* Main Container */
        .test-paper-container {{
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
        }}

        /* Header Section */
        .test-header {{
            width: 100%;
            border-bottom: 2px solid var(--color-primary);
            margin-bottom: 30px;
            padding-bottom: 10px;
            text-align: center;
        }}

        .test-title {{
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
        }}

        .test-info {{
            font-size: 12pt;
            display: flex;
            justify-content: center;
            gap: 20px;
            font-weight: bold;
        }}

        /* Content Body - Two Columns */
        .test-body {{
            column-count: 2;
            column-fill: auto;
            column-gap: 15mm;
            text-align: left;
            width: 100%;
        }}

        /* Prevent Breakage Inside Questions */
        .question-item, .question-block {{
            break-inside: avoid;
            page-break-inside: avoid;
            column-break-inside: avoid;
            -webkit-column-break-inside: avoid;
            margin-bottom: 2em;
            border-bottom: 1px dotted var(--color-border);
            padding-bottom: 1em;
        }}

        /* Passages */
        .passage-box, .passage-block {{
            text-align: left;
            margin-bottom: 1.5em;
            padding: 10px;
            background: var(--color-light-blue);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            break-inside: avoid;
            page-break-inside: avoid;
            column-break-inside: avoid;
            -webkit-column-break-inside: avoid;
        }}

        .passage-text {{
            font-size: 10.5pt;
            line-height: 1.8;
            white-space: pre-wrap;
        }}

        /* Choices */
        .choices {{
            display: grid;
            grid-template-columns: 1fr;
            gap: 5px;
            margin-top: 10px;
            padding-left: 0;
            list-style: none;
            text-align: left; /* Ensure natural alignment */
            break-inside: avoid;
            page-break-inside: avoid;
            column-break-inside: avoid;
            -webkit-column-break-inside: avoid;
        }}

        .choice-item {{
            font-size: 10.5pt;
            padding-left: 5px;
            break-inside: avoid;
            page-break-inside: avoid;
            column-break-inside: avoid;
            -webkit-column-break-inside: avoid;
        }}

        .question-box, .question-stem {{
            break-inside: avoid;
            page-break-inside: avoid;
            column-break-inside: avoid;
            -webkit-column-break-inside: avoid;
        }}

        .page-break {{
            break-after: page;
        }}
        
        /* Explanation Section Styles */
        .answer-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }}
        .answer-table th, .answer-table td {{ border: 1px solid var(--color-border); padding: 8px; text-align: left; }}
        .answer-table th {{ background-color: var(--color-light-yellow); }}
        .badge {{ display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 0.8em; margin-right: 5px; }}
        .badge-correct {{ background-color: var(--color-light-green); color: var(--color-primary); }}
        .badge-wrong {{ background-color: var(--color-light-yellow); color: var(--color-accent); }}
        .content-area {{ overflow: hidden; padding-bottom: 25mm; }}
        .answer-footer {{ max-height: 15mm; overflow: hidden; }}

        /* Fallback / Screen Styles & Paged.js Preview Styles */
        @media screen {{
            body {{ background: var(--color-light-blue); }}

            .screen-pages {{
                display: none;
            }}

            body.screen-paginated .screen-pages {{
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                padding: 20px;
                background: var(--color-light-blue);
            }}

            body.screen-paginated .test-paper-container {{
                display: none;
            }}

            body.pagedjs-preview .test-paper-container {{
                display: none;
            }}

            body.pagedjs-preview .screen-pages {{
                display: none;
            }}

            body.pagedjs-preview .pagedjs_pages {{
                display: flex;
            }}
            
            .test-paper-container {{
                background: white;
                padding: 40px;
                min-height: 297mm;
                border: 1px solid var(--color-border);
            }}

            /* Paged.js creates these classes for preview */
            .pagedjs_pages {{
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                background: var(--color-light-blue);
            }}
            
            .pagedjs_sheet {{
                background: white;
                border: 1.5px solid var(--color-secondary);
                margin-bottom: 20px; /* Space between pages */
                width: 210mm;
                height: 297mm;
            }}

            .pagedjs_page {{
                background: white;
            }}

            .screen-page {{
                width: 210mm;
                height: 297mm;
                background: white;
                border: 1.5px solid var(--color-secondary);
            }}

            .screen-page-inner {{
                height: 100%;
                box-sizing: border-box;
                padding: 20mm 15mm;
                display: flex;
                flex-direction: column;
                gap: 6mm;
            }}

            .screen-header {{
                border-bottom: 2px solid var(--color-primary);
                padding-bottom: 3mm;
                text-align: center;
            }}

            .screen-title {{
                font-size: 18pt;
                font-weight: bold;
                margin-bottom: 4mm;
            }}

            .screen-info {{
                font-size: 12pt;
                display: flex;
                justify-content: center;
                gap: 12mm;
                font-weight: bold;
            }}

            .screen-body {{
                flex: 1 1 auto;
                column-count: 2;
                column-gap: 15mm;
                overflow: hidden;
            }}

            .screen-footer {{
                flex: 0 0 12mm;
                max-height: 15mm;
                overflow: hidden;
                font-size: 10pt;
                color: #666;
                text-align: center;
            }}
        }}
    </style>
</head>
<body>
    <div class="test-paper-container">
        <div class="test-header">
            <div class="test-title">국어농장 진단 테스트 - {title}</div>
            <div class="test-info">
                <span>학년: __________</span>
                <span>이름: __________</span>
                <span>점수: __________</span>
            </div>
        </div>
        <div class="test-body">
"""

HTML_FOOTER = """
        </div> <!-- End of test-body -->
    </div> <!-- End of test-paper-container -->
    <script>
    (function () {{
        function hasPagedJs() {{
            return typeof window.PagedPolyfill !== 'undefined';
        }}

        function collectItems(body) {{
            const items = [];
            Array.from(body.children).forEach((child) => {{
                if (child.classList && child.classList.contains('page-break')) {{
                    items.push({{ type: 'page-break' }});
                    return;
                }}
                if (child.classList.contains('questions')) {{
                    const qItems = child.querySelectorAll('.question-item');
                    qItems.forEach((q) => items.push(q));
                }} else {{
                    items.push(child);
                }}
            }});

            let node = body.nextElementSibling;
            while (node) {{
                if (node.classList && node.classList.contains('page-break')) {{
                    items.push({{ type: 'page-break' }});
                }} else {{
                    items.push(node);
                }}
                node = node.nextElementSibling;
            }}

            return items;
        }}

        function createHeaderClone(original) {{
            if (!original) {{
                return null;
            }}
            const title = original.querySelector('.test-title');
            const info = original.querySelector('.test-info');

            const header = document.createElement('div');
            header.className = 'screen-header';

            const titleEl = document.createElement('div');
            titleEl.className = 'screen-title';
            titleEl.textContent = title ? title.textContent : '국어농장 진단 테스트';
            header.appendChild(titleEl);

            const infoEl = document.createElement('div');
            infoEl.className = 'screen-info';
            infoEl.innerHTML = info ? info.innerHTML : '';
            header.appendChild(infoEl);

            return header;
        }}

        function buildScreenPages() {{
            if (document.querySelector('.screen-pages')) {{
                return;
            }}
            const container = document.querySelector('.test-paper-container');
            if (!container) {{
                return;
            }}
            const body = container.querySelector('.test-body');
            if (!body) {{
                return;
            }}

            const items = collectItems(body);
            const pages = document.createElement('div');
            pages.className = 'screen-pages';

            function newPage(isFirst) {{
                const page = document.createElement('div');
                page.className = 'screen-page';

                const inner = document.createElement('div');
                inner.className = 'screen-page-inner';

                if (isFirst) {{
                    const header = createHeaderClone(container.querySelector('.test-header'));
                    if (header) {{
                        inner.appendChild(header);
                    }}
                }}

                const bodyEl = document.createElement('div');
                bodyEl.className = 'screen-body content-area';
                inner.appendChild(bodyEl);

                const footer = document.createElement('div');
                footer.className = 'screen-footer answer-footer';
                inner.appendChild(footer);

                page.appendChild(inner);
                pages.appendChild(page);
                return {{ page, bodyEl, footer }};
            }}

            let pageObj = newPage(true);

            items.forEach((item) => {{
                if (item && item.type === 'page-break') {{
                    pageObj = newPage(false);
                    return;
                }}

                const clone = item.cloneNode(true);
                pageObj.bodyEl.appendChild(clone);

                if (pageObj.bodyEl.scrollHeight > pageObj.bodyEl.clientHeight + 1) {{
                    pageObj.bodyEl.removeChild(clone);
                    pageObj = newPage(false);
                    pageObj.bodyEl.appendChild(clone);
                }}
            }});

            const pageNodes = pages.querySelectorAll('.screen-page');
            pageNodes.forEach((page, idx) => {{
                const footer = page.querySelector('.screen-footer');
                if (footer) {{
                    footer.textContent = `Page ${{idx + 1}} of ${{pageNodes.length}}`;
                }}
            }});

            document.body.classList.add('screen-paginated');
            document.body.insertBefore(pages, container);
        }}

        function initPagination() {{
            let attempts = 0;
            const maxAttempts = 12;
            const intervalMs = 200;

            function checkPagedJs() {{
                const pagedPages = document.querySelector('.pagedjs_pages');
                if (pagedPages) {{
                    document.body.classList.add('pagedjs-preview');
                    return;
                }}

                attempts += 1;
                if (attempts >= maxAttempts) {{
                    buildScreenPages();
                    return;
                }}

                setTimeout(checkPagedJs, intervalMs);
            }}

            if (!hasPagedJs()) {{
                buildScreenPages();
                return;
            }}

            checkPagedJs();
        }}

        window.addEventListener('load', function () {{
            setTimeout(initPagination, 200);
        }});
    }})();
    </script>
</body>
</html>
"""

def load_passage_data(data_dir):
    # Load Passage
    with open(os.path.join(data_dir, 'passage.md'), 'r', encoding='utf-8') as f:
        passage_text = f.read()
    
    # Load Questions
    questions = []
    q_files = sorted(glob(os.path.join(data_dir, 'questions', '*.json')))
    for qf in q_files:
        with open(qf, 'r', encoding='utf-8') as f:
            questions.append(json.load(f))
            
    # Load Metadata for Section Title
    meta_path = os.path.join(data_dir, 'metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
            # e.g. "S1_LIT_P2 (문학)"
            section_title = f"{meta.get('passage_id', 'Passage')} ({meta.get('genre', '')})"
    else:
        section_title = os.path.basename(data_dir)
            
    return {
        'title': section_title,
        'passage': passage_text,
        'questions': questions
    }

def generate_html(datasets, output_file, title="통합 본"):
    body_content = ""
    answers_content = "<h2>정답 및 해설</h2>"
    
    id_map = {'A': '①', 'B': '②', 'C': '③', 'D': '④', 'E': '⑤'}
    
    total_q_idx = 1
    
    for data in datasets:
        # 1. Subject Section - REMOVED per user request
        # body_content += f'<div class="section-title">{data["title"]}</div>'
        
        body_content += f'<div class="passage-box"><div class="passage-text">{data["passage"]}</div></div>'
        
        # 2. Questions
        body_content += '<div class="questions">'
        for q_data in data['questions']:
            q = q_data['question']
            q_type = q.get('type', '지문근거형')
            
            body_content += f'<div class="question-item">'
            # Removed [{q_type}] label per user request
            body_content += f'<div class="question-stem">{total_q_idx}. {q["stem"]}</div>'
            
            if 'box' in q and q['box']:
                body_content += f'<div class="question-box">{q["box"]}</div>'
            
            if q_type == '서술형':
                body_content += '<div class="choices" style="border: 1px dashed #ccc; padding: 10px; color: #555;">(서술형 답안을 작성하세요)</div>'
                body_content += '</div>'
                
                questions_html = ""
                
                answers_content += f"<h3>{data['title']}</h3>" if q_data == data['questions'][0] else ""
                
                model_answer = q_data.get('model_answer', '')
                criteria = q_data.get('grading_criteria', [])
                
                criteria_html = ""
                for c in criteria:
                    vec_str = ", ".join([f"{k}:{v}" for k, v in c.get('vector', {}).items()])
                    criteria_html += f"<div>- {c['condition']} ({c['score']}점) <br><span style='font-size:0.8em; color:#666;'>[벡터: {vec_str}]</span></div>"
                
                answers_content += f"""
                <table class="answer-table">
                <thead><tr><th width="10%">문항</th><th width="20%">모범 답안</th><th>채점 기준 및 벡터</th></tr></thead>
                <tbody>
                <tr>
                    <td>{total_q_idx}번</td>
                    <td>{model_answer}</td>
                    <td>{criteria_html}</td>
                </tr>
                </tbody>
                </table>
                """
                
            else:
                # Multiple Choice
                choices = q_data.get('choices', [])
                body_content += '<ul class="choices">'
                for c in choices:
                    display_id = id_map.get(c["choice_id"], c["choice_id"])
                    body_content += f'<li class="choice-item">{display_id} {c["text"]}</li>'
                body_content += '</ul></div>'
                
                # Answer Section for MC
                answers_content += f"<h3>{data['title']}</h3>" if q_data == data['questions'][0] else ""
                
                answers_content += '<table class="answer-table">'
                answers_content += '<thead><tr><th width="10%">문항</th><th width="10%">정답</th><th>선택지 분석, 오답 경로 및 벡터</th></tr></thead><tbody>'
                
                correct = q_data['correct_choice']
                correct_display = id_map.get(correct, correct)
                
                explanation_rows = ""
                for c in choices:
                    is_correct = (c['choice_id'] == correct)
                    badge_cls = "badge-correct" if is_correct else "badge-wrong"
                    path = c['error_path']
                    display_id = id_map.get(c["choice_id"], c["choice_id"])
                    
                    vec_str = ", ".join([f"{k}:{v}" for k, v in c.get('vector', {}).items()])
                    
                    explanation_rows += f"<div><span class='badge {badge_cls}'>{display_id}</span> {path} <br><span style='font-size:0.8em; color:#666; margin-left: 20px;'>[벡터: {vec_str}]</span></div>"

                answers_content += f"""
                <tr>
                    <td>{total_q_idx}번</td>
                    <td><strong>{correct_display}</strong></td>
                    <td>{explanation_rows}</td>
                </tr>
                """
                answers_content += '</tbody></table>'
            
            total_q_idx += 1
            
        body_content += '</div>' 
        # End of Dataset Loop

    # Combine All
    final_html = HTML_HEADER.format(title=title)
    final_html += body_content
    final_html += '<div class="page-break"></div>'
    final_html += answers_content
    final_html += HTML_FOOTER.format()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print(f"Generated: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('output_file', help='Output HTML file path')
    parser.add_argument('data_dirs', nargs='+', help='List of data directories')
    parser.add_argument('--title', default="진단 테스트", help='Paper Title')
    args = parser.parse_args()
    
    all_datasets = []
    for d in args.data_dirs:
        if os.path.exists(d):
            all_datasets.append(load_passage_data(d))
        else:
            print(f"Warning: Directory not found {d}")
    
    generate_html(all_datasets, args.output_file, title=args.title)
