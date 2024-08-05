# Doodle Guessr dataset generator

## About

[Doodle Guessr](https://github.com/ivang5/doodle-guessr) uses data from [Quickdraw dataset](https://github.com/googlecreativelab/quickdraw-dataset) for training CNN model, but it requires data in a different format. This program is used to transform [Quickdraw dataset](https://github.com/googlecreativelab/quickdraw-dataset) to a format appropriate for [Doodle Guessr](https://github.com/ivang5/doodle-guessr). For the purposes of [Doodle Guessr](https://github.com/ivang5/doodle-guessr), the data used is taken from [simplified drawing files](https://console.cloud.google.com/storage/browser/quickdraw_dataset/full/simplified;tab=objects).

## What does it do?

There are several things this program does to prepare the dataset for [Doodle Guessr](https://github.com/ivang5/doodle-guessr):

1. Gets drawings from ndjson files.
2. Converts drawings to SVG, then to Base64 and finally Pixel Array.
3. Adds padding to drawings (model performs better with padded drawings).
4. Rescales drawings
5. Saves drawings in a JSON format

## How to use it?

To use this program, simply add a `data` folder to the root of this project and fill it with any files from [simplified drawing files](https://console.cloud.google.com/storage/browser/quickdraw_dataset/full/simplified;tab=objects). When you run `node index.js`, the program will create a new folder and start filling it with newly generated files. You can change how many files the program will go through at once and how many drawings will it use from each file.
