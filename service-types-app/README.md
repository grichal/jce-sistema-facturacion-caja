# Service Types App

## Overview
The Service Types App is a React application designed to manage service types. It allows users to create, update, and view a list of service types through a user-friendly interface.

## Features
- Display a list of service types.
- Create new service types using a modal form.
- Update existing service types through the same modal.
- Responsive design for better usability on various devices.

## Project Structure
```
service-types-app
├── src
│   ├── index.tsx               # Entry point of the application
│   ├── App.tsx                 # Main application component
│   ├── pages
│   │   └── ServiceTypesPage.tsx # Page component for service types
│   ├── components
│   │   └── ServiceTypes
│   │       ├── ServiceTypesList.tsx # Component to list service types
│   │       ├── ServiceTypeItem.tsx   # Component for individual service type
│   │       └── ServiceTypeModal.tsx  # Modal for creating/updating service types
│   ├── hooks
│   │   └── useModal.ts          # Custom hook for modal management
│   ├── services
│   │   └── serviceTypesApi.ts   # API calls related to service types
│   ├── store
│   │   └── serviceTypes.ts      # State management for service types
│   └── types
│       └── index.ts             # TypeScript types and interfaces
├── public
│   └── index.html               # Main HTML file
├── package.json                 # NPM configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd service-types-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
To start the application, run:
```
npm start
```
This will launch the app in your default web browser.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.