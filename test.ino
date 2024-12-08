// samle code with  api end point 

#include <Arduino.h>
#include <ArduinoJson.h>

// Define pins for your compartment dispensing mechanism
const int COMPARTMENT_PINS[] = {2, 3, 4, 5}; // Example pin numbers
const int NUM_COMPARTMENTS = 4;

void setup() {
    // Initialize serial communication
    Serial.begin(115200);

    // Set up compartment pins as outputs
    for (int i = 0; i < NUM_COMPARTMENTS; i++) {
        pinMode(COMPARTMENT_PINS[i], OUTPUT);
        digitalWrite(COMPARTMENT_PINS[i], LOW);
    }
}

void dispenseFromCompartment(int compartmentNumber, int count) {
    // Validate compartment number
    if (compartmentNumber < 1 || compartmentNumber > NUM_COMPARTMENTS) {
        Serial.println("Invalid compartment number");
        return;
    }

    // Activate the specific compartment's dispensing mechanism
    int pinIndex = compartmentNumber - 1;
    
    // Example dispensing logic - customize based on your actual mechanism
    for (int i = 0; i < count; i++) {
        digitalWrite(COMPARTMENT_PINS[pinIndex], HIGH);
        delay(500); // Adjust timing for your specific dispensing mechanism
        digitalWrite(COMPARTMENT_PINS[pinIndex], LOW);
        delay(200);
    }
}

void loop() {
    // Check for incoming serial data
    if (Serial.available() > 0) {
        // Read the incoming JSON string
        String jsonString = Serial.readStringUntil('\n');
        
        // Parse JSON
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, jsonString);
        
        // Check for parsing errors
        if (error) {
            Serial.print("JSON parsing failed: ");
            Serial.println(error.c_str());
            return;
        }
        
        // Extract compartment number and count
        int compartmentNumber = doc["compartmentNumber"];
        int count = doc["count"];
        
        // Dispense medications
        dispenseFromCompartment(compartmentNumber, count);
    }
}