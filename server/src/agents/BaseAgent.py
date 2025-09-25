import datetime

class BaseAgent:
    def __init__(self, agent_type, options=None):
        self.agent_type = agent_type
        self.options = options or {
            'timeout': 300000,
            'maxRetries': 3
        }
        # self.openai = ... # Add OpenAI client if needed

    def run(self, input, parameters=None):
        parameters = parameters or {}
        start_time = datetime.datetime.utcnow()
        try:
            result = self.process(input, parameters)
            duration = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000
            return {
                'status': 'completed',
                'output': result,
                'metadata': {
                    'agentType': self.agent_type,
                    'duration': duration,
                    'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
                    'parameters': parameters
                }
            }
        except Exception as error:
            duration = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000
            return {
                'status': 'failed',
                'output': None,
                'error': {
                    'message': str(error),
                    'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
                },
                'metadata': {
                    'agentType': self.agent_type,
                    'duration': duration,
                    'parameters': parameters
                }
            }

    def process(self, input, parameters):
        raise NotImplementedError(f"process method must be implemented by {self.agent_type} agent")

    def validate_parameters(self, parameters, required_fields=None):
        required_fields = required_fields or []
        missing = [field for field in required_fields if field not in parameters or not parameters[field]]
        if missing:
            raise ValueError(f"Missing required parameters: {', '.join(missing)}")

    def get_capabilities(self):
        return {
            'agentType': self.agent_type,
            'inputTypes': ['text', 'json', 'url'],
            'outputTypes': ['text', 'json', 'structured_data'],
            'maxInputSize': 100000,
            'estimatedProcessingTime': 60000,
            'supportedLanguages': ['en'],
            'version': '1.0.0'
        }
