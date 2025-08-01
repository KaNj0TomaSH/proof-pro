#!/bin/bash

# Kill any existing bot processes
pkill -f "tsx src/index" || true
pkill -f "npm run start" || true

# Wait a moment for processes to stop
sleep 2

# Start the bot in background
echo "Starting bot in background..."
nohup npm run start > bot.log 2>&1 &

# Get the process ID
BOT_PID=$!
echo "Bot started with PID: $BOT_PID"

# Save PID to file
echo $BOT_PID > bot.pid

# Wait for bot to start
sleep 5

# Show initial logs
echo "Initial logs:"
tail -n 20 bot.log

echo ""
echo "Bot is running in background!"
echo "To view logs: tail -f bot.log"
echo "To stop: kill $(cat bot.pid)"