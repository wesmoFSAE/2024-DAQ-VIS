#!/bin/bash
# File: update_website.sh
# Author: Hannah Murphy
# Date: 2024
# Description:  Strips the VM of the old website directories,
#               pulls the lasted code from GitHub and then redeploys
#               the website with the new code.
#
# Copyright (c) 2024 WESMO. All rights reserved.
# This script is part of the WESMO Data Acquisition and Visualisation Project.
#
# Usage: ./update_website.sh

# Define variables
WEB_DIR="/var/www/wesmo.co.nz/html"
APP_DIR="/home/ubuntu/WESMO-2024/wesmo-app"

# Remove the existing HTML files
sudo rm -r $WEB_DIR

# Create a new HTML directory
sudo mkdir -p $WEB_DIR

# Change to the application directory
cd $APP_DIR

# Pull the latest code from the git repository
git pull

# Install the necessary npm packages
#npm install

# Build the application
#npm run build

# Copy the build files to the web directory
sudo cp -r build/* $WEB_DIR

# Restart the nginx service
sudo systemctl restart nginx

echo "Website update completed successfully."
