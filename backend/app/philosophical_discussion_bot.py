from app.question_graph import QuestionGraph
from openai import OpenAI
import json
from typing import Dict, List, Optional

class PhilosophicalDiscussionBot:
    def __init__(self, question_graph, api_key: str, model="gpt-4o"):
        """
        Initialize the discussion bot with a QuestionGraph instance.
        
        Args:
            question_graph: QuestionGraph instance containing the question space
            api_key: OpenAI API key
        """
        self.question_graph = question_graph
        self.model = model
        self.client = OpenAI(api_key=api_key)
        self.conversation_history = []
        self.current_question = question_graph.central_question
        self.user_positions: Dict[str, str] = {}
        
    def start_discussion(self) -> str:
        """Initiates the philosophical discussion."""
        opening_message = self._generate_opening_message()
        self.conversation_history.append({"role": "assistant", "content": opening_message})
        return opening_message

    def _generate_opening_message(self) -> str:
        print("Generating opening message...")
        """Generate the opening message using the GPT API."""
        messages = [
            {"role": "system", "content": "You are a philosophical discussion facilitator helping users explore their thoughts on complex questions. Be concise, clear, and thought-provoking."},
            {"role": "user", "content": f"Generate a brief opening message to start a philosophical discussion about '{self.question_graph.central_question}'. Invite the user to share their initial thoughts."}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=150
        )
        return response.choices[0].message.content

    def process_user_response(self, user_message: str) -> str:
        print("Processing user response...")
        """
        Process user's response and generate the next step in the discussion.
        
        Args:
            user_message: The user's message
            
        Returns:
            str: Bot's response
        """
        # Store user's position on current question
        self.user_positions[self.current_question] = user_message
        self.conversation_history.append({"role": "user", "content": user_message})
        
        # Analyze response and determine next question
        next_question = self._determine_next_question(user_message)
        response = self._generate_discussion_response(user_message, next_question)
        
        self.conversation_history.append({"role": "assistant", "content": response})
        self.current_question = next_question
        
        return response

    def _determine_next_question(self, user_message: str) -> str:
        print("Determining next question...")
        """
        Determine the next most relevant question based on user's response.
        
        Args:
            user_message: The user's last message
            
        Returns:
            str: Next question to discuss
        """
        # If there are no child questions, generate a new one
        if not self.question_graph.graph[self.current_question]:
            self.question_graph.expand_graph()
            
        with open('app/prompts/determine_next_question.txt', 'r') as file:
            prompt_template = file.read()
        
        messages = [
            {"role": "system", "content": "You are helping select the next relevant question in a philosophical discussion."},
            {"role": "user", "content": prompt_template.format(
            current_question=self.current_question,
            user_message=user_message,
            question_list=self.question_graph.graph[self.current_question]
            )}
        ]

        
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=50
        )
        
        return response.choices[0].message.content.strip()

    def _generate_discussion_response(self, user_message: str, next_question: str) -> str:
        print("Generating response...")
        """
        Generate a response that bridges the user's last message to the next question.
        
        Args:
            user_message: The user's last message
            next_question: The next question to discuss
            
        Returns:
            str: Generated response
        """
        with open('app/prompts/generate_discussion_response.txt', 'r') as file:
            prompt_template = file.read()
        
        messages = [
            {"role": "system", "content": "You are facilitating a philosophical discussion. Respond thoughtfully but concisely to the user's ideas and guide them to the next question."},
            {"role": "user", "content": prompt_template.format(
            current_question=self.current_question,
            user_message=user_message,
            next_question=next_question
            )}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=150
        )
        
        return response.choices[0].message.content

    def check_equilibrium(self) -> bool:
        print("Checking equilibrium...")
        """
        Check if the user has reached erotetic equilibrium based on their responses.
        
        Returns:
            bool: True if equilibrium reached, False otherwise
        """
        with open('app/prompts/check_equilibrium.txt', 'r') as file:
            prompt_template = file.read()
        
        messages = [
            {"role": "system", "content": "You are analyzing philosophical positions for consistency and depth of understanding."},
            {"role": "user", "content": prompt_template.format(
            user_positions=json.dumps(self.user_positions, indent=2)
            )}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=10
        )
        
        return response.choices[0].message.content.lower().strip() == "true"

    def get_summary(self) -> str:
        """
        Generate a summary of the user's philosophical position and journey.
        
        Returns:
            str: Summary of the discussion and user's position
        """
        with open('app/prompts/get_summary.txt', 'r') as file:
            prompt_template = file.read()
        
        messages = [
            {"role": "system", "content": "You are summarizing a philosophical discussion and the development of a user's position."},
            {"role": "user", "content": prompt_template.format(
            user_positions=json.dumps(self.user_positions, indent=2)
            )}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=200
        )
        
        return response.choices[0].message.content
    
    
