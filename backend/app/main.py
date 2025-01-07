from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
from app.question_graph import QuestionGraph
from app.philosophical_discussion_bot import PhilosophicalDiscussionBot
import os
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.chat_connections: Dict[str, WebSocket] = {}
        self.discussion_bots: Dict[str, PhilosophicalDiscussionBot] = {}
        self.graphs: Dict[str, QuestionGraph] = {}
        self.api_key = os.getenv('OPENAI_API_KEY')

    def get_graph_data(self, client_id: str) -> dict:
        """Convert the graph structure to visualization format"""
        question_graph = self.graphs[client_id]
        nodes = []
        edges = []
        
        # Add nodes with summaries
        for i, (question, details) in enumerate(question_graph.graph.items()):
            nodes.append({
                "summary": details['summary'],
                "question": question
            })
        
        # Add edges
        node_to_id = {question: i for i, question in enumerate(question_graph.graph.keys())}
        for question, details in question_graph.graph.items():
            source_id = node_to_id[question]
            for connected_question in details['questions']:
                target_id = node_to_id[connected_question]
                edges.append({
                    "source": source_id,
                    "target": target_id
                })
        
        return {
            "type": "graph_data",
            "data": {
                "nodes": nodes,
                "edges": edges
            }
        }

    async def connect_chat(self, websocket: WebSocket, client_id: str, initial_question: str):
        """Initialize session with graph and discussion bot"""
        self.chat_connections[client_id] = websocket
        
        # Create graph and discussion bot
        question_graph = QuestionGraph(api_key=self.api_key, central_question=initial_question)
        self.graphs[client_id] = question_graph
        self.discussion_bots[client_id] = PhilosophicalDiscussionBot(question_graph, api_key=self.api_key)

    def disconnect_chat(self, client_id: str):
        if client_id in self.chat_connections:
            del self.chat_connections[client_id]
        if client_id in self.discussion_bots:
            del self.discussion_bots[client_id]
        if client_id in self.graphs:
            del self.graphs[client_id]

    async def send_typing_indicator(self, client_id: str, is_typing: bool):
        if client_id in self.chat_connections:
            await self.chat_connections[client_id].send_json({
                "type": "typing",
                "typing": is_typing
            })

manager = ConnectionManager()

@app.websocket("/ws/chat/{client_id}")
async def chat_websocket_endpoint(websocket: WebSocket, client_id: str):
    try:
        await websocket.accept()
        
        # Wait for initial question
        initial_data = await websocket.receive_json()
        initial_question = initial_data.get('message', "What is knowledge?")
        
        # Initialize chat and create graph
        await manager.connect_chat(websocket, client_id, initial_question)
        
        # Send graph data
        graph_data = manager.get_graph_data(client_id)
        await websocket.send_json(graph_data)
        
        # Get discussion bot
        discussion_bot = manager.discussion_bots[client_id]
        
        # Start discussion
        await manager.send_typing_indicator(client_id, True)
        opening_message = discussion_bot.start_discussion()
        await websocket.send_json({
            "type": "message",
            "message": opening_message
        })
        await manager.send_typing_indicator(client_id, False)
        
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "message":
                user_message = data["message"]
                
                await manager.send_typing_indicator(client_id, True)
                
                # Process message
                bot_response = discussion_bot.process_user_response(user_message)
                
                # Check for equilibrium
                if discussion_bot.check_equilibrium():
                    summary = discussion_bot.get_summary()
                    await websocket.send_json({
                        "type": "message",
                        "message": bot_response
                    })
                    await asyncio.sleep(1)
                    await websocket.send_json({
                        "type": "message",
                        "message": f"\n\nDiscussion Summary:\n{summary}"
                    })
                    await websocket.send_json({
                        "type": "discussion_ended",
                        "message": "Discussion has reached equilibrium"
                    })
                else:
                    await websocket.send_json({
                        "type": "message",
                        "message": bot_response
                    })
                
                await manager.send_typing_indicator(client_id, False)
                
    except WebSocketDisconnect:
        manager.disconnect_chat(client_id)
    except Exception as e:
        print(f"Error in chat WebSocket connection: {e}")
        await websocket.send_json({
            "type": "error",
            "message": "An error occurred in the discussion"
        })
        manager.disconnect_chat(client_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)