import AgentJob from '../models/AgentJob.js';
import AgentResult from '../models/AgentResult.js';

const prisma = {
  agentJob: {
    update: async ({ where, data }) => {
      const id = where?.id || where?._id;
      return AgentJob.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    },
  },
  agentResult: {
    create: async ({ data }) => {
      return AgentResult.create(data);
    },
  },
};

export default prisma;
