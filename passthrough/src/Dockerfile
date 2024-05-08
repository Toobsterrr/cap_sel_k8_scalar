# Use a base image with Node.js pre-installed
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your application listens on
EXPOSE 8080

# Install wget
RUN apt-get update && apt-get install -y wget

# Command to run the application
CMD ["node", "app.js"]
