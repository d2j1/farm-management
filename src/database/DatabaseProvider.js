// ============================================================
// DatabaseProvider — React Context for the SQLite db instance
// ============================================================
// Wraps the app so every screen can call `useDatabase()` to get
// the initialised db handle from initDb.ts.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { initDatabase } from './initDb';

const DatabaseContext = createContext(null);

/**
 * Hook to access the database instance from any component.
 * Must be used inside <DatabaseProvider>.
 */
export function useDatabase() {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return db;
}

/**
 * Provider component — call initDatabase() once, then hand
 * the db instance to the rest of the tree via context.
 */
export function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then((database) => {
        if (!cancelled) setDb(database);
      })
      .catch((err) => {
        console.error('Failed to initialise database:', err);
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ef4444', fontSize: 15 }}>
          Database error — please restart the app.
        </Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}




