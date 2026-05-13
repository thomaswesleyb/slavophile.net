import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {Idiom} from "../types/types.ts";


interface IdiomProviderProps {
    children: ReactNode;
}

interface IdiomContextValue {
    idioms: Idiom[];
    loading: boolean;
}

const IdiomContext = createContext<IdiomContextValue | undefined>(undefined);

export const IdiomProvider: React.FC<IdiomProviderProps> = ({ children }) => {
    const [idioms, setIdioms] = useState<Idiom[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchIdioms = async () => {
            try {
                const response = await fetch('/.netlify/functions/firestore-get-idioms');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const idiomsData = await response.json();
                setIdioms(idiomsData);
            } catch {
                // silently fail - app shows empty state
            } finally {
                setLoading(false);
            }
        };

        fetchIdioms();
    }, []);

    return (
        <IdiomContext.Provider value={{ idioms, loading }}>
            {children}
        </IdiomContext.Provider>
    );
};

export const useIdioms = () => {
    const context = useContext(IdiomContext);
    if (context === undefined) {
        throw new Error('useIdioms must be used within an IdiomProvider');
    }
    return context;
};