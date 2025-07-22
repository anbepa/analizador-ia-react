import React, { createContext, useState, useEffect, useMemo, useContext, useRef } from 'react';
import { callAiApi } from '../lib/apiService';
import { PROMPT_FLOW_ANALYSIS_FROM_IMAGES, PROMPT_BUG_TICKET, PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT } from '../lib/prompts';

import { loadReports, saveReports } from '../lib/idbService';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('original');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [refinementOptions, setRefinementOptions] = useState({});
  const [ticketData, setTicketData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browserCapture, setBrowserCapture] = useState(null);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserError, setBrowserError] = useState(null);
  const [showConfigurationPanel, setShowConfigurationPanel] = useState(true); // Nuevo estado para controlar la visibilidad

  const value = {
    report,
    setReport,
    loading,
    setLoading,
    error,
    setError,
    activeTab,
    setActiveTab,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    analysisResult,
    setAnalysisResult,
    refinementOptions,
    setRefinementOptions,
    ticketData,
    setTicketData,
    isModalOpen,
    setIsModalOpen,
    browserCapture,
    setBrowserCapture,
    browserLoading,
    setBrowserLoading,
    browserError,
    setBrowserError,
    showConfigurationPanel, // Añadir al contexto
    setShowConfigurationPanel, // Añadir al contexto
  };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};