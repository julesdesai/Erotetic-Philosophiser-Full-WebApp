import random
from openai import OpenAI
from typing import Dict, List, Tuple, Optional
import os

class DialecticalGraph:
    PROMPT_FILES = {
        "thesis": "thesis_prompt.txt",
        "antithesis": "antithesis_prompt.txt",
        "synthesis": "synthesis_prompt.txt",
        "view_identity": "view_identity_prompt.txt",
        "nonsense": "nonsense_prompt.txt"
    }
    def __init__(self, api_key: str, central_question: str, prompt_dir: str = "./prompts", num_responses: int = 3):
        self.client = OpenAI(api_key=api_key)
        self.graph: Dict[str, Dict[str, any]] = {}
        self.central_question = central_question
        self.graph[self.central_question] = {
            "type": "question",
            "content": central_question,
            "children": []
        }
        self.num_responses = num_responses
        self.prompt_dir = prompt_dir
        self.prompts = self._load_prompts()
        self.initialize_graph()
        
    def _load_prompts(self) -> Dict[str, str]:
        """Load all prompt templates from files"""
        prompts = {}
        try:
            for prompt_type, filename in self.PROMPT_FILES.items():
                file_path = os.path.join(self.prompt_dir, filename)
                with open(file_path, 'r') as file:
                    prompts[prompt_type] = file.read().strip()
            return prompts
        except Exception as e:
            raise Exception(f"Error loading prompts: {e}")

    def generate_completion(self, prompt: str, system_role: str, max_tokens: int = 150) -> str:
        """Generate a completion with error handling"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-0125-preview",
                messages=[
                    {"role": "system", "content": system_role},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error in API call: {e}")

    def generate_theses(self) -> List[str]:
        """Generate N thesis responses to the central question"""
        system_role = "You are a philosophical inquirer generating thesis statements."
        prompt = self.prompts["thesis"].format(
            num_responses=self.num_responses,
            question=self.central_question
        )

        try:
            response = self.generate_completion(prompt, system_role)
            theses = [thesis.strip() for thesis in response.split('\n') if thesis.strip()]
            return theses[:self.num_responses]  # Ensure we only return requested number
        except Exception as e:
            raise Exception(f"Error generating theses: {e}")

    def generate_antitheses(self, thesis: str) -> List[str]:
        """Generate N antitheses for a given thesis"""
        system_role = "You are a critical philosopher generating objections to thesis statements."
        prompt = self.prompts["antithesis"].format(
            num_responses=self.num_responses,
            thesis=thesis
        )

        try:
            response = self.generate_completion(prompt, system_role)
            antitheses = [antithesis.strip() for antithesis in response.split('\n') if antithesis.strip()]
            return antitheses[:self.num_responses]
        except Exception as e:
            raise Exception(f"Error generating antitheses: {e}")

    def generate_syntheses(self, thesis: str, antithesis: str) -> List[str]:
        """Generate N syntheses from a thesis-antithesis pair"""
        system_role = "You are a dialectical philosopher generating synthetic positions."
        prompt = self.prompts["synthesis"].format(
            num_responses=self.num_responses,
            thesis=thesis,
            antithesis=antithesis
        )

        try:
            response = self.generate_completion(prompt, system_role, max_tokens=300)
            syntheses = [synthesis.strip() for synthesis in response.split('\n') if synthesis.strip()]
            return syntheses[:8]  # Ensure we only return 8 syntheses
        except Exception as e:
            raise Exception(f"Error generating syntheses: {e}")

    def generate_view_identity(self, synthesis: str) -> bool:
        """Generate a view identity analysis for a synthesis"""
        system_role = "You are an analyst identifying the philosophical viewpoint of statements."
        prompt = self.prompts["view_identity"].format(
            synthesis=synthesis
        )

        try:
            return self.generate_completion(prompt, system_role, max_tokens=50)
        except Exception as e:
            raise Exception(f"Error generating view identity: {e}. Not Boolean")

    def generate_nonsense_check(self, synthesis: str) -> bool:
        """Check if a synthesis is meaningful or nonsense"""
        system_role = "You are a philosophical critic evaluating statements for meaningfulness."
        prompt = self.prompts["nonsense"].format(
            synthesis=synthesis
        )

        try:
            return self.generate_completion(prompt, system_role, max_tokens=50)
        except Exception as e:
            raise Exception(f"Error generating nonsense check: {e}. Not Boolean")

    def add_node(self, content: str, node_type: str, parent_id: Optional[str] = None) -> str:
        """Add a new node to the graph and return its ID"""
        node_id = f"{node_type}_{len(self.graph)}"
        self.graph[node_id] = {
            "type": node_type,
            "content": content,
            "children": []
        }
        if parent_id:
            self.graph[parent_id]["children"].append(node_id)
        return node_id

    def initialize_graph(self) -> None:
        """Initialize the complete dialectical graph"""
        try:
            # Generate theses
            theses = self.generate_theses()
            for thesis in theses:
                thesis_id = self.add_node(thesis, "thesis", self.central_question)
                
                # Generate antitheses for each thesis
                antitheses = self.generate_antitheses(thesis)
                for antithesis in antitheses:
                    antithesis_id = self.add_node(antithesis, "antithesis", thesis_id)
                    
                    # Generate syntheses for each thesis-antithesis pair
                    syntheses = self.generate_syntheses(thesis, antithesis)
                    for synthesis in syntheses:
                        synthesis_id = self.add_node(synthesis, "synthesis", antithesis_id)
                        
                        # Generate additional analyses for each synthesis
                        view_identity = self.generate_view_identity(synthesis)
                        nonsense_check = self.generate_nonsense_check(synthesis)
                        
                        # Add analyses as properties of the synthesis node
                        self.graph[synthesis_id]["view_identity"] = view_identity
                        self.graph[synthesis_id]["nonsense_check"] = nonsense_check

        except Exception as e:
            raise Exception(f"Error initializing graph: {e}")

    def get_node_content(self, node_id: str) -> Dict:
        """Retrieve the content and metadata for a node"""
        if node_id not in self.graph:
            raise ValueError(f"Node {node_id} not found in graph")
        return self.graph[node_id]

    def get_children(self, node_id: str) -> List[str]:
        """Get the children of a node"""
        if node_id not in self.graph:
            raise ValueError(f"Node {node_id} not found in graph")
        return self.graph[node_id]["children"]