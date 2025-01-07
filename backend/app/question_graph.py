import random
from openai import OpenAI
from typing import Dict, List, Tuple

class QuestionGraph:
    def __init__(self, api_key: str, central_question: str = "What is knowledge?", num_nodes: int = 10):
        self.client = OpenAI(api_key=api_key)
        self.graph: Dict[str, Dict[str, any]] = {}
        self.central_question = central_question
        self.graph[self.central_question] = {"summary": "", "questions": []}
        
        # Instead of recursive calls in __init__, create initial structure
        self.initialize_graph(num_nodes)
    
    def initialize_graph(self, num_nodes: int) -> None:
        """Safely initialize the graph with the specified number of nodes"""
        nodes_created = 0
        max_attempts = num_nodes * 2  # Prevent infinite loops
        attempt_count = 0
        
        while nodes_created < num_nodes - 1 and attempt_count < max_attempts:
            try:
                self.expand_graph()
                nodes_created += 1
            except Exception as e:
                print(f"Error creating node: {e}")
            attempt_count += 1
            
        if nodes_created < num_nodes - 1:
            print(f"Warning: Only created {nodes_created} nodes out of {num_nodes} requested")

    def add_question(self, parent_question: str, summary: str, new_question: str) -> None:
        """Add a new question to the graph if it doesn't already exist"""
        if new_question in self.graph:
            return  # Prevent duplicate questions
            
        if parent_question in self.graph:
            self.graph[parent_question]["questions"].append(new_question)
            self.graph[new_question] = {"summary": summary, "questions": []}

    def get_random_question(self) -> str:
        """Get a random question that hasn't reached maximum connections"""
        eligible_questions = [
            q for q, data in self.graph.items() 
            if len(data["questions"]) < 3  # Limit connections per node
        ]
        if not eligible_questions:
            raise ValueError("No eligible questions available for expansion")
        return random.choice(eligible_questions)

    def get_local_context(self, question: str) -> Dict:
        """Get the context for a question with error handling"""
        if question not in self.graph:
            return {"summary": "", "questions": []}
        return self.graph[question]

    def generate_question(self, random_question: str, central_question: str, context: Dict) -> Tuple[str, str]:
        """Generate a new question with improved error handling and validation"""
        try:
            with open('app/prompts/generate_question.txt', 'r') as file:
                prompt_template = file.read()
            
            prompt = prompt_template.format(
                random_question=random_question,
                central_question=central_question,
                context=context
            )
            
            response = self.client.chat.completions.create(
                model="gpt-4-0125-preview",
                messages=[
                    {"role": "system", "content": "You are a critical question-based inquirer who is building the question space surrounding a central question."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50
            )
            
            content = response.choices[0].message.content.strip()
            parts = content.split('\n', 1)
            
            if len(parts) != 2:
                raise ValueError("Invalid response format from API")
                
            summary, question = parts
            
            # Validate response
            if not summary or not question or len(summary) < 5 or len(question) < 5:
                raise ValueError("Invalid response content")
                
            return summary.strip(), question.strip()
            
        except Exception as e:
            raise Exception(f"Error generating question: {e}")

    def expand_graph(self) -> None:
        """Expand the graph with error handling and cycle prevention"""
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                random_question = self.get_random_question()
                local_context = self.get_local_context(random_question)
                summary, new_question = self.generate_question(
                    random_question, 
                    self.central_question, 
                    local_context
                )
                
                # Prevent duplicate questions
                if new_question not in self.graph:
                    self.add_question(random_question, summary, new_question)
                    return
                    
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise Exception(f"Failed to expand graph after {max_attempts} attempts: {e}")
                continue