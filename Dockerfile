FROM node:latest

# Create app directory
RUN mkdir -p /home/node/app && chown -R node:node /home/node
WORKDIR /home/node/app

USER node

CMD [ "./entrypoint.sh" ]
