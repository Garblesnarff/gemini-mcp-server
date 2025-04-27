# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Set environment variables with defaults (can be overridden at runtime)
ENV GEMINI_API_KEY=""
ENV OUTPUT_DIR="/app/output"
ENV DEBUG="false"

# Create output directory
RUN mkdir -p /app/output

# Expose the port if your server uses a specific port
# EXPOSE 8080

# Set the entrypoint to run the server
ENTRYPOINT ["node", "bin/gemini-mcp-server.js"]
