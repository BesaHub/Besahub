import React, { createContext, useContext, useState } from 'react';

const CommunicationContext = createContext();

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within CommunicationProvider');
  }
  return context;
};

export const CommunicationProvider = ({ children }) => {
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contextEntity, setContextEntity] = useState(null);

  const openPhoneDialer = (contact = null, entity = null) => {
    setSelectedContact(contact);
    setContextEntity(entity);
    setPhoneDrawerOpen(true);
  };

  const openEmailComposer = (contact = null, entity = null) => {
    setSelectedContact(contact);
    setContextEntity(entity);
    setEmailDrawerOpen(true);
  };

  const openCalendar = () => {
    setCalendarDrawerOpen(true);
  };

  return (
    <CommunicationContext.Provider
      value={{
        phoneDrawerOpen,
        setPhoneDrawerOpen,
        emailDrawerOpen,
        setEmailDrawerOpen,
        calendarDrawerOpen,
        setCalendarDrawerOpen,
        selectedContact,
        setSelectedContact,
        contextEntity,
        setContextEntity,
        openPhoneDialer,
        openEmailComposer,
        openCalendar
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};
