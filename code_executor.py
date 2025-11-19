"""
Code Execution Engine for KodesCRUxxx
Supports multiple programming languages via Piston API (Free & Open Source)
"""

import httpx
import logging
from typing import Dict, Optional, List
from config import settings

logger = logging.getLogger(__name__)

# Piston API endpoint (Free, no API key required)
PISTON_API_URL = "https://emkc.org/api/v2/piston"

# Supported languages mapping
SUPPORTED_LANGUAGES = {
    "Python": "python",
    "JavaScript": "javascript",
    "TypeScript": "typescript",
    "Java": "java",
    "C++": "c++",
    "C": "c",
    "C#": "csharp",
    "Ruby": "ruby",
    "Go": "go",
    "Rust": "rust",
    "PHP": "php",
    "Swift": "swift",
    "Kotlin": "kotlin",
    "R": "r",
    "Perl": "perl",
    "Lua": "lua",
    "Bash": "bash",
    "Scala": "scala",
}


class CodeExecutor:
    """Executes code in various programming languages using Piston API"""
    
    def __init__(self):
        """Initialize code executor with HTTP client"""
        self.client = httpx.AsyncClient(timeout=30.0)
        self.base_url = PISTON_API_URL
    
    async def get_runtimes(self) -> List[Dict]:
        """
        Get list of available language runtimes
        
        Returns:
            List of runtime information
        """
        try:
            response = await self.client.get(f"{self.base_url}/runtimes")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch runtimes: {e}")
            return []
    
    async def execute_code(
        self,
        code: str,
        language: str,
        stdin: str = "",
        version: str = "*",
    ) -> Dict:
        """
        Execute code and return results
        
        Args:
            code: Source code to execute
            language: Programming language name
            stdin: Standard input (optional)
            version: Language version (default: latest)
            
        Returns:
            Dict with output, error, execution details
        """
        try:
            # Validate language
            if language not in SUPPORTED_LANGUAGES:
                return {
                    "success": False,
                    "error": f"Language '{language}' is not supported. Supported: {', '.join(SUPPORTED_LANGUAGES.keys())}",
                    "output": "",
                    "language": language,
                }
            
            # Prepare request payload
            piston_language = SUPPORTED_LANGUAGES[language]
            
            payload = {
                "language": piston_language,
                "version": version,
                "files": [
                    {
                        "name": self._get_filename(language),
                        "content": code
                    }
                ],
                "stdin": stdin,
                "args": [],
                "compile_timeout": 10000,  # 10 seconds
                "run_timeout": 3000,        # 3 seconds
                "compile_memory_limit": -1,
                "run_memory_limit": -1,
            }
            
            logger.info(f"Executing {language} code via Piston API")
            
            # Execute code
            response = await self.client.post(
                f"{self.base_url}/execute",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse response
            return self._parse_response(data, language)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during code execution: {e}")
            return {
                "success": False,
                "error": f"API Error: {e.response.status_code} - {e.response.text}",
                "output": "",
                "language": language,
            }
        except httpx.TimeoutException:
            logger.error("Code execution timed out")
            return {
                "success": False,
                "error": "Execution timed out. Your code might be running an infinite loop or taking too long.",
                "output": "",
                "language": language,
            }
        except Exception as e:
            logger.error(f"Unexpected error during code execution: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "output": "",
                "language": language,
            }
    
    def _get_filename(self, language: str) -> str:
        """Get appropriate filename for the language"""
        extensions = {
            "Python": "main.py",
            "JavaScript": "main.js",
            "TypeScript": "main.ts",
            "Java": "Main.java",
            "C++": "main.cpp",
            "C": "main.c",
            "C#": "Main.cs",
            "Ruby": "main.rb",
            "Go": "main.go",
            "Rust": "main.rs",
            "PHP": "main.php",
            "Swift": "main.swift",
            "Kotlin": "Main.kt",
            "R": "main.r",
            "Perl": "main.pl",
            "Lua": "main.lua",
            "Bash": "main.sh",
            "Scala": "Main.scala",
        }
        return extensions.get(language, "main.txt")
    
    def _parse_response(self, data: Dict, language: str) -> Dict:
        """Parse Piston API response"""
        
        # Get compile output (for compiled languages)
        compile_output = data.get("compile", {})
        compile_stdout = compile_output.get("stdout", "")
        compile_stderr = compile_output.get("stderr", "")
        
        # Get run output
        run_output = data.get("run", {})
        run_stdout = run_output.get("stdout", "")
        run_stderr = run_output.get("stderr", "")
        run_code = run_output.get("code", 0)
        
        # Check for compilation errors
        if compile_stderr:
            return {
                "success": False,
                "error": compile_stderr,
                "output": compile_stdout,
                "language": language,
                "stage": "compilation",
            }
        
        # Check for runtime errors
        if run_stderr or run_code != 0:
            return {
                "success": False,
                "error": run_stderr or f"Program exited with code {run_code}",
                "output": run_stdout,
                "language": language,
                "stage": "runtime",
                "exit_code": run_code,
            }
        
        # Success
        return {
            "success": True,
            "output": run_stdout,
            "error": None,
            "language": language,
            "version": data.get("language"),
        }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global executor instance
executor = CodeExecutor()