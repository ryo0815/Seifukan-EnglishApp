# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# --- Python Setup ---
# Install Python, pip, and build essentials
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for the Python script and requirements
RUN mkdir -p /app/python
COPY python/requirements.txt /app/python/
COPY python/evaluate_dtw.py /app/python/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r /app/python/requirements.txt

# --- Node.js Setup ---
# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
