# Debian-based node base image
FROM node:20-bookworm

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Create and set working directory
RUN mkdir /app
WORKDIR /app
COPY package*.json ./
# Add app
COPY ./app ./

# Install project dependencies
RUN npm install

# Installations for Python, needed for running sim
RUN apt-get update && apt-get install -y \
  build-essential \
  zlib1g-dev \
  libncurses5-dev \
  libgdbm-dev \
  libnss3-dev \
  libssl-dev \
  libreadline-dev \
  libffi-dev \
  libsqlite3-dev \
  wget \
  libbz2-dev \
  python3

# Start the Node app
CMD ["npm", "start"]



















