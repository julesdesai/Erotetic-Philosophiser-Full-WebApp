from question_graph import QuestionGraph
from philosophical_discussion_bot import PhilosophicalDiscussionBot
from dotenv import load_dotenv
import os

# Initialize the components
load_dotenv()  # Load environment variables
api_key = os.getenv('API_KEY')
model="gpt-4o"
question_graph = QuestionGraph(api_key = api_key, central_question="What is knowledge?", num_nodes=6)
discussion_bot = PhilosophicalDiscussionBot(question_graph, api_key = api_key, model=model)
question_graph.save_visualization("test.png")

# Start the discussion
opening_message = discussion_bot.start_discussion()
print("Bot:", opening_message)

# Main discussion loop
while not discussion_bot.check_equilibrium():
    # Get user input
    user_input = input("You: ")
    
    # Get bot's response
    bot_response = discussion_bot.process_user_response(user_input)
    print("Bot:", bot_response)

# Generate final summary
summary = discussion_bot.get_summary()
print("\nDiscussion Summary:")
print(summary)