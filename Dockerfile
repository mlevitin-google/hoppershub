# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller image for the production environment
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the previous stage
COPY --from=0 /app/.next ./.next
COPY --from=0 /app/node_modules ./node_modules
COPY --from=0 /app/package.json ./package.json
COPY --from=0 /app/public ./public

# Expose the port the application will run on
EXPOSE 3000

# Set the command to run the application
CMD ["npm", "start"]
