"""
Helper utilities for KodesCRUxxx
"""

import re
from typing import List, Dict

def clean_code_block(text: str) -> str:
    """Remove markdown code blocks from text"""
    # Remove ```language and ```
    text = re.sub(r'```\w*\n', '', text)
    text = re.sub(r'```', '', text)
    return text.strip()

def format_response(response: str) -> str:
    """Format AI response for better display"""
    # Add spacing after headers
    response = re.sub(r'(#{1,6}\s+.+)', r'\1\n', response)
    # Add spacing around lists
    response = re.sub(r'(\n\d+\.|\n-)', r'\n\1', response)
    return response

def validate_language(language: str) -> bool:
    """Validate if programming language is supported"""
    supported = [
        "python", "javascript", "java", "c++", "c#",
        "ruby", "go", "rust", "typescript", "php"
    ]
    return language.lower() in supported

def extract_code_snippets(text: str) -> List[str]:
    """Extract code snippets from markdown text"""
    pattern = r'```(?:\w+)?\n(.*?)```'
    matches = re.findall(pattern, text, re.DOTALL)
    return matches