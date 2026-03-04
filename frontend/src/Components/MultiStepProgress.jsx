import { useState } from 'react';
import { HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi2';

export default function MultiStepProgress({ currentStep, totalSteps, onNext, onBack, canProceed = true }) {
  const steps = [
    { id: 1, title: "Account Setup", description: "Create your secure account" },
    { id: 2, title: "Personal Info", description: "Tell us about yourself" },
  ];

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
              ${currentStep > step.id 
                ? 'bg-yellow-400 border-yellow-400 text-black' 
                : currentStep === step.id 
                  ? 'border-yellow-400 text-yellow-400 bg-black' 
                  : 'border-gray-600 text-gray-500 bg-black'
              }
            `}>
              {currentStep > step.id ? (
                <HiCheck size={20} />
              ) : (
                <span className="font-bold">{step.id}</span>
              )}
            </div>
            
            {/* Step Info */}
            <div className="ml-3 hidden sm:block">
              <div className={`font-semibold text-sm ${
                currentStep >= step.id ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
              <div className={`text-xs ${
                currentStep >= step.id ? 'text-yellow-200' : 'text-gray-600'
              }`}>
                {step.description}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`
                hidden sm:block w-20 h-0.5 mx-6 transition-colors duration-300
                ${currentStep > step.id ? 'bg-yellow-400' : 'bg-gray-600'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Progress Bar */}
      <div className="sm:hidden mb-4">
        <div className="flex justify-between text-sm text-yellow-400 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`
            flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg text-sm font-medium
            transition-all duration-200
            ${currentStep > 1 
              ? 'hover:border-yellow-400 hover:text-yellow-400' 
              : 'opacity-50 cursor-not-allowed'
            }
          `}
          disabled={currentStep <= 1}
        >
          <HiArrowLeft size={16} />
          Back
        </button>

        {currentStep < totalSteps && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200
              ${canProceed
                ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Next
            <HiArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}