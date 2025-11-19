"""
AI Engine Module for KodesCRUxxx
Handles all AI/LLM interactions using OpenAI
"""

import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from config import settings

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize OpenAI LLM
try:
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.MODEL_NAME,
        temperature=settings.TEMPERATURE,
        max_tokens=settings.MAX_TOKENS,
        request_timeout=30
    )
    logger.info(f"✅ LLM initialized with model: {settings.MODEL_NAME}")
except Exception as e:
    logger.error(f"❌ Failed to initialize LLM: {e}")
    llm = None

def safe_llm_invoke(chain, params: dict) -> str:
    """
    Safely invoke LLM with error handling
    
    Args:
        chain: LangChain chain object
        params: Parameters for the prompt
        
    Returns:
        str: LLM response or error message
    """
    if llm is None:
        return "❌ Error: OpenAI API not configured. Please check your API key."
    
    try:
        response = chain.invoke(params)
        # Handle different response types
        if hasattr(response, 'content'):
            return response.content
        return str(response)
    except Exception as e:
        logger.error(f"LLM invocation error: {e}")
        return f"❌ Error generating response: {str(e)}"

def explain_code(language: str, topic: str, level: str, code: str = "") -> str:
    """
    Explain a coding concept or topic, optionally with code
    
    Args:
        language: Programming language
        topic: Topic to explain (optional if code is provided)
        level: Learner level (Beginner/Intermediate/Advanced)
        code: Optional code to explain
        
    Returns:
        str: Explanation
    """
    if code and code.strip():
        # If code is provided, explain the code
        prompt = ChatPromptTemplate.from_template(
            """You are an expert programming tutor with years of teaching experience.
            
Explain the following {language} code for a {level} level learner:

```{language}
{code}
```

Context/Topic: {topic}

Provide:
1. A clear, line-by-line explanation of what the code does
2. Explanation of key concepts and patterns used
3. Real-world use cases for this code
4. Common pitfalls or improvements
5. How each part contributes to the overall functionality

Make it engaging, educational, and easy to understand."""
        )
        chain = prompt | llm
        return safe_llm_invoke(chain, {
            "code": code,
            "topic": topic or "General code explanation",
            "language": language,
            "level": level
        })
    else:
        # If no code, explain the topic/concept
        prompt = ChatPromptTemplate.from_template(
            """You are an expert programming tutor with years of teaching experience.
            
Explain the following topic in {language} for a {level} level learner:
Topic: {topic}

Provide:
1. A clear, concise explanation
2. Real-world use cases
3. A simple code example with comments
4. Common pitfalls to avoid

Make it engaging and easy to understand."""
        )
        chain = prompt | llm
        return safe_llm_invoke(chain, {
            "topic": topic,
            "language": language,
            "level": level
        })

def debug_code(language: str, code: str, topic: str = "") -> str:
    """
    Debug code and find errors
    
    Args:
        language: Programming language
        code: Code to debug
        topic: Optional context topic
        
    Returns:
        str: Debugging analysis
    """
    if not code or code.strip() == "":
        return "⚠️ Please provide code to debug."
    
    prompt = ChatPromptTemplate.from_template(
        """You are an expert code reviewer and debugger.
Analyze the following {language} code and identify any bugs, errors, or issues:

```{language}
{code}
```

Context: {topic}

Provide:
- Issues Found: List all bugs, errors, and potential problems
- Explanation: Explain why each issue occurs
- Fixed Code: Provide the corrected version
- Best Practices: Suggest improvements

Be thorough and constructive."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "language": language,
        "code": code,
        "topic": topic or "General debugging"
    })

def generate_code(language: str, topic: str, level: str) -> str:
    """
    Generate code examples
    
    Args:
        language: Programming language
        topic: What to generate code for
        level: Complexity level
        
    Returns:
        str: Generated code
    """
    prompt = ChatPromptTemplate.from_template(
        """You are an expert {language} developer.
Generate a {level} level code example for: {topic}

Requirements:
- Write clean, well-structured code
- Add detailed comments explaining each part
- Follow {language} best practices and conventions
- Include error handling where appropriate
- Make it production-ready
- Only return the code with comments, no additional explanation outside the code."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "topic": topic,
        "language": language,
        "level": level
    })

def convert_logic_to_code(logic: str, language: str) -> str:
    """
    Convert pseudo-code or logic to actual code
    
    Args:
        logic: Pseudo-code or logic description
        language: Target programming language
        
    Returns:
        str: Converted code
    """
    if not logic or logic.strip() == "":
        return "⚠️ Please provide logic or pseudo-code to convert."
    
    prompt = ChatPromptTemplate.from_template(
        """You are an expert programmer skilled in converting logic to code.
Convert the following logic/pseudo-code to {language}:

{logic}

Provide:
- Clean, executable {language} code
- Inline comments explaining the logic
- Proper error handling
- Best practices implementation
- Only return the code, no additional text."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "logic": logic,
        "language": language
    })

def analyze_complexity(code: str) -> str:
    """
    Analyze time and space complexity
    
    Args:
        code: Code to analyze
        
    Returns:
        str: Complexity analysis
    """
    if not code or code.strip() == "":
        return "⚠️ Please provide code to analyze."
    
    prompt = ChatPromptTemplate.from_template(
        """You are a computer science expert specializing in algorithm analysis.
Analyze the time and space complexity of the following code:

{code}

Provide:
- Time Complexity: Big O notation with explanation
- Space Complexity: Big O notation with explanation
- Line-by-line Analysis: Break down the complexity of key operations
- Optimization Suggestions: How to improve performance
- Best/Average/Worst Case: If applicable

Be detailed and educational."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {"code": code})

def trace_code(code: str, language: str) -> str:
    """
    Trace code execution step by step
    
    Args:
        code: Code to trace
        language: Programming language
        
    Returns:
        str: Step-by-step trace
    """
    if not code or code.strip() == "":
        return "⚠️ Please provide code to trace."
    
    prompt = ChatPromptTemplate.from_template(
        """You are a programming instructor teaching code execution flow.
Trace the execution of this {language} code step-by-step:

{code}

Provide:
- Initial State: Variables and their initial values
- Step-by-Step Execution: Line-by-line trace with variable changes
- Decision Points: Explain conditionals and loops
- Final State: Output and final variable values
- Visual Flow: Use arrows or markers to show flow

Make it clear and educational."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "code": code,
        "language": language
    })

def get_snippets(language: str, topic: str) -> str:
    """
    Get useful code snippets
    
    Args:
        language: Programming language
        topic: Topic for snippets
        
    Returns:
        str: Code snippets
    """
    prompt = ChatPromptTemplate.from_template(
        """You are a {language} expert creating a snippet library.
Generate 10 useful, production-ready code snippets in {language} related to: {topic}

For each snippet:
- Title: Brief description
- Code: Clean, commented code
- Use Case: When to use it
- Example: Quick usage example

Format clearly with numbered sections."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "language": language,
        "topic": topic
    })

def get_projects(level: str, topic: str) -> str:
    """
    Generate project ideas
    
    Args:
        level: Difficulty level
        topic: Topic area
        
    Returns:
        str: Project ideas
    """
    prompt = ChatPromptTemplate.from_template(
        """You are a software engineering educator creating project ideas.
Generate 10 innovative {level} level project ideas related to: {topic}

For each project:
- Title: Catchy project name
- Description: What the project does
- Key Features: 3-5 main features
- Tech Stack: Recommended technologies
- Learning Outcomes: Skills you'll gain
- Estimated Time: How long it might take

Make them practical, engaging, and portfolio-worthy."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "level": level,
        "topic": topic
    })

def get_roadmaps(level: str, topic: str) -> str:
    """
    Generate learning roadmaps
    
    Args:
        level: Current skill level
        topic: Topic to learn
        
    Returns:
        str: Learning roadmap
    """
    prompt = ChatPromptTemplate.from_template(
        """You are a career coach and technical educator.
Create a comprehensive learning roadmap for {topic} tailored for {level} learners.

Include:
- Prerequisites: What to know before starting
- Phase 1 - Foundations: Core concepts (with timeline)
- Phase 2 - Intermediate: Building on basics (with timeline)
- Phase 3 - Advanced: Expert-level topics (with timeline)
- Recommended Resources: Books, courses, documentation
- Practice Projects: Hands-on exercises for each phase
- Milestones: How to measure progress

Make it actionable and motivating."""
    )
    chain = prompt | llm
    return safe_llm_invoke(chain, {
        "level": level,
        "topic": topic
    })

def check_llm_health() -> dict:
    """
    Check if LLM is properly configured
    
    Returns:
        dict: Health status information
    """
    if llm is None:
        return {
            "status": "error",
            "message": "LLM not initialized. Check API key."
        }
    
    try:
        # Quick test
        test_prompt = ChatPromptTemplate.from_template("Say 'OK' if you can read this.")
        chain = test_prompt | llm
        response = safe_llm_invoke(chain, {})
        
        return {
            "status": "healthy",
            "message": "LLM is operational",
            "model": settings.MODEL_NAME
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
