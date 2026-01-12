import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Snackbar,
  Card,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack,
  Save,
  AttachMoney,
  Home,
  LocationOn,
  Business,
  Add,
  CloudUpload,
  Delete,
  Photo,
  ContactPhone,
  AccountBalance,
  Description as DescriptionIcon,
  Apartment
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { propertyApi } from '../../services/propertyApi';
import { compressImage, getCompressionOptions, validateImageFile } from '../../utils/imageCompression';
import ImageGallery from '../../components/ImageGallery';

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    propertyType: '',
    status: 'for_sale',
    propertyStatus: 'active', // Required: 'active', 'under_loi', 'off_market', 'sold_leased'
    listingType: 'sale',
    listingDate: '',
    expirationDate: '',
    internalPropertyId: '',
    mlsNumber: '',
    listPrice: '',
    leaseRate: '',
    leaseRateUnit: 'per_sqft_annual',
    leaseType: '',
    leaseTerms: {
      minTerm: '',
      maxTerm: '',
      renewalOptions: '',
      securityDeposit: '',
      personalGuaranteeRequired: false
    },
    grossIncome: '',
    hoaFees: '',
    propertyTaxes: '',
    leaseTermsDescription: '',
    availabilityDate: '',
    totalSquareFootage: '',
    availableSquareFootage: '',
    lotSize: '',
    lotSizeUnit: 'sqft',
    lotDimensions: '',
    buildingClass: '',
    yearBuilt: '',
    renovationYear: '',
    numberOfUnits: '',
    ceilingHeight: '',
    clearHeight: '',
    floors: '',
    loadingDocks: '',
    driveInDoors: '',
    parkingRatio: '',
    description: '',
    zoning: '',
    parkingSpaces: '',
    amenities: [],
    keyHighlights: [],
    keyFeatures: [],
    marketingRemarks: '',
    highlights: '',
    marketingStatus: 'draft',
    pricePerSquareFoot: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    listingAgent: '',
    brokerage: '',
    coBrokerSplit: '',
    transactionStatus: 'active',
    dateSoldLeased: '',
    finalSalePrice: '',
    finalLeaseRate: '',
    buyerTenantName: '',
    notes: '',
    images: [],
    documents: [],
    floorPlans: [],
    sitePlans: [],
    offeringMemorandum: '',
    brochure: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [keyHighlightInput, setKeyHighlightInput] = useState('');
  const [keyFeatureInput, setKeyFeatureInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadingFloorPlans, setUploadingFloorPlans] = useState(false);
  const [uploadingSitePlans, setUploadingSitePlans] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedFloorPlans, setSelectedFloorPlans] = useState([]);
  const [selectedSitePlans, setSelectedSitePlans] = useState([]);

  const propertyTypes = [
    'office',
    'retail',
    'industrial'
  ];

  const statusOptions = [
    'for_sale',
    'for_lease',
    'sold',
    'leased',
    'off_market',
    'coming_soon'
  ];

  const propertyStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'under_loi', label: 'Under LOI' },
    { value: 'off_market', label: 'Off Market' },
    { value: 'sold_leased', label: 'Sold / Leased' }
  ];

  const lotSizeUnits = ['sqft', 'acres'];
  const transactionStatuses = ['active', 'under_contract', 'closed', 'cancelled'];

  const buildingClasses = ['A', 'B', 'C'];
  const marketingStatuses = ['draft', 'published', 'expired', 'suspended'];

  useEffect(() => {
    if (isEditing) {
      fetchProperty();
    }
  }, [id, isEditing]);

  // Prevent accidental page reload/navigation when form has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Photo upload functions
  const handleImageUpload = async (files) => {
    setUploadingImages(true);

    try {
      // Validate and compress images
      const processedFiles = [];
      const fileUrls = [];
      let totalSavings = 0;
      let totalOriginalSize = 0;

      for (const file of files) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: `${file.name}: ${validation.errors[0]}`,
            severity: 'error'
          });
          continue;
        }

        // Get compression options for property images
        const compressionOptions = getCompressionOptions('property', file.type);

        // Compress image
        const originalSize = file.size;
        const compressedFile = await compressImage(file, compressionOptions);
        const compressedSize = compressedFile.size;

        totalOriginalSize += originalSize;
        totalSavings += (originalSize - compressedSize);

        processedFiles.push(compressedFile);
        fileUrls.push(URL.createObjectURL(compressedFile));
      }

      if (processedFiles.length === 0) {
        setUploadingImages(false);
        return;
      }

      // Show compression results
      if (totalSavings > 0) {
        const savingsPercent = ((totalSavings / totalOriginalSize) * 100).toFixed(1);
        setSnackbar({
          open: true,
          message: `Images compressed: ${savingsPercent}% size reduction (${(totalSavings / 1024 / 1024).toFixed(1)}MB saved)`,
          severity: 'info'
        });
      }

      if (!isEditing) {
        // For new properties, just store files to upload after property creation
        setSelectedFiles(prev => [...prev, ...processedFiles]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...fileUrls]
        }));
        setUploadingImages(false);
        return;
      }

      // For existing properties, upload immediately
      const response = await propertyApi.uploadImages(id, processedFiles);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...response.images]
      }));

      setSnackbar({
        open: true,
        message: `${processedFiles.length} photo(s) uploaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to process or upload photos',
        severity: 'error'
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index) => {
    if (!isEditing) {
      // For new properties, just remove from local state
      const newImages = formData.images.filter((_, i) => i !== index);
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, images: newImages }));
      setSelectedFiles(newFiles);
      return;
    }

    // For existing properties, remove from server
    try {
      await propertyApi.removeImage(id, index);
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, images: newImages }));

      setSnackbar({
        open: true,
        message: 'Photo removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove photo',
        severity: 'error'
      });
    }
  };

  // Document validation function
  const validateDocumentFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB

    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, images');
    }

    if (file.size > maxSizeBytes) {
      errors.push(`File too large. Maximum size: ${maxSizeBytes / 1024 / 1024}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Document upload function
  const handleDocumentUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingDocuments(true);
      const processedFiles = [];

      for (const file of files) {
        // Validate file
        const validation = validateDocumentFile(file);
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: `${file.name}: ${validation.errors[0]}`,
            severity: 'error'
          });
          continue;
        }

        processedFiles.push(file);
      }

      if (processedFiles.length === 0) {
        setUploadingDocuments(false);
        return;
      }

      if (!isEditing) {
        // For new properties, store files to upload after property creation
        setSelectedDocuments(prev => [...prev, ...processedFiles]);
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, ...processedFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(f)
          }))]
        }));
        setUploadingDocuments(false);
        return;
      }

      // For existing properties, upload immediately
      const response = await propertyApi.uploadDocuments(id, processedFiles);

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...response.documents]
      }));

      setSnackbar({
        open: true,
        message: `${processedFiles.length} document(s) uploaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to process or upload documents',
        severity: 'error'
      });
    } finally {
      setUploadingDocuments(false);
    }
  };

  // Remove document function
  const handleRemoveDocument = async (index) => {
    if (!isEditing) {
      // For new properties, just remove from local state
      const newDocuments = formData.documents.filter((_, i) => i !== index);
      const newFiles = selectedDocuments.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, documents: newDocuments }));
      setSelectedDocuments(newFiles);
      return;
    }

    // For existing properties, remove from server
    try {
      await propertyApi.removeDocument(id, index);
      const newDocuments = formData.documents.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, documents: newDocuments }));

      setSnackbar({
        open: true,
        message: 'Document removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove document',
        severity: 'error'
      });
    }
  };

  const onDrop = (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== acceptedFiles.length) {
      setSnackbar({
        open: true,
        message: 'Only image files are allowed',
        severity: 'warning'
      });
    }
    if (imageFiles.length > 0) {
      handleImageUpload(imageFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const fetchProperty = async () => {
    try {
      setLoading(true);

      // Mock property data as fallback
      const mockProperty = {
        id: id,
        name: 'Sample Property',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        propertyType: 'office',
        status: 'available',
        listingType: 'sale',
        listPrice: 2500000,
        leaseRate: '',
        totalSquareFootage: 15000,
        buildingClass: 'A',
        yearBuilt: 2020,
        description: 'Sample property for demonstration purposes.',
        zoning: 'Commercial',
        parkingSpaces: 50,
        amenities: ['High-speed internet', 'Conference rooms', 'On-site parking'],
        marketingStatus: 'draft',
        pricePerSquareFoot: 167,
        images: []
      };

      // Check if this is a sample/hardcoded property (starts with 'sample-')
      if (id && id.startsWith('sample-')) {
        // Load from local storage cache
        const LOCAL_KEY = 'dev_properties_cache';
        try {
          const cachedProperties = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
          const sampleProp = cachedProperties.find(p => String(p.id) === String(id));
          if (sampleProp) {
            const property = sampleProp;
          setFormData({
            name: property.name || '',
            address: property.address || '',
            city: property.city || '',
            state: property.state || '',
            zipCode: property.zipCode || '',
            county: property.county || '',
            propertyType: property.propertyType || '',
            status: property.status || 'for_sale',
            propertyStatus: property.propertyStatus || '',
            listingType: property.listingType || 'sale',
            listingDate: property.listingDate ? property.listingDate.split('T')[0] : '',
            expirationDate: property.expirationDate ? property.expirationDate.split('T')[0] : '',
            internalPropertyId: property.internalPropertyId || '',
            mlsNumber: property.mlsNumber || '',
            listPrice: property.listPrice || '',
            leaseRate: property.leaseRate || '',
            leaseRateUnit: property.leaseRateUnit || 'per_sqft_annual',
            leaseType: property.leaseType || '',
            leaseTerms: property.leaseTerms || {
              minTerm: '',
              maxTerm: '',
              renewalOptions: '',
              securityDeposit: '',
              personalGuaranteeRequired: false
            },
            grossIncome: property.grossIncome || '',
            hoaFees: property.hoaFees || '',
            propertyTaxes: property.propertyTaxes || '',
            leaseTermsDescription: property.leaseTermsDescription || '',
            availabilityDate: property.availabilityDate ? property.availabilityDate.split('T')[0] : '',
            totalSquareFootage: property.totalSquareFootage || '',
            availableSquareFootage: property.availableSquareFootage || '',
            lotSize: property.lotSize || '',
            lotSizeUnit: property.lotSizeUnit || 'sqft',
            lotDimensions: property.lotDimensions || '',
            buildingClass: property.buildingClass || '',
            yearBuilt: property.yearBuilt || '',
            renovationYear: property.renovationYear || '',
            numberOfUnits: property.numberOfUnits || '',
            ceilingHeight: property.ceilingHeight || '',
            clearHeight: property.clearHeight || '',
            floors: property.floors || '',
            loadingDocks: property.loadingDocks || '',
            driveInDoors: property.driveInDoors || '',
            parkingRatio: property.parkingRatio || '',
            description: property.description || '',
            zoning: property.zoning || '',
            parkingSpaces: property.parkingSpaces || '',
            amenities: property.amenities || [],
            keyHighlights: property.keyHighlights || [],
            keyFeatures: property.keyFeatures || [],
            marketingRemarks: property.marketingRemarks || '',
            highlights: property.highlights || '',
            marketingStatus: property.marketingStatus || 'draft',
            pricePerSquareFoot: property.pricePerSquareFoot || '',
            ownerName: property.ownerName || '',
            ownerEmail: property.ownerEmail || '',
            ownerPhone: property.ownerPhone || '',
            listingAgent: property.listingAgent || '',
            brokerage: property.brokerage || '',
            coBrokerSplit: property.coBrokerSplit || '',
            transactionStatus: property.transactionStatus || 'active',
            dateSoldLeased: property.dateSoldLeased ? property.dateSoldLeased.split('T')[0] : '',
            finalSalePrice: property.finalSalePrice || '',
            finalLeaseRate: property.finalLeaseRate || '',
            buyerTenantName: property.buyerTenantName || '',
            notes: property.notes || '',
            images: property.images || [],
            documents: property.documents || [],
            floorPlans: property.floorPlans || [],
            sitePlans: property.sitePlans || [],
            offeringMemorandum: property.offeringMemorandum || '',
            brochure: property.brochure || ''
          });
          
          // Reset unsaved changes flag when property is loaded
          setHasUnsavedChanges(false);
          setLoading(false);
          return;
        }
      } catch (cacheError) {
        console.error('Error reading from cache:', cacheError);
      }
    }
    
    // Try API fetch
    try {
      const response = await propertyApi.getProperty(id);

      if (response && response.property) {
        const apiProperty = response.property;
        setFormData({
          name: apiProperty.name || '',
          address: apiProperty.address || '',
          city: apiProperty.city || '',
          state: apiProperty.state || '',
          zipCode: apiProperty.zipCode || '',
          county: apiProperty.county || '',
          propertyType: apiProperty.propertyType || '',
          status: apiProperty.status || 'for_sale',
          propertyStatus: apiProperty.propertyStatus || '',
          listingType: apiProperty.listingType || 'sale',
          listingDate: apiProperty.listingDate ? apiProperty.listingDate.split('T')[0] : '',
          expirationDate: apiProperty.expirationDate ? apiProperty.expirationDate.split('T')[0] : '',
          internalPropertyId: apiProperty.internalPropertyId || '',
          mlsNumber: apiProperty.mlsNumber || '',
          listPrice: apiProperty.listPrice || '',
          leaseRate: apiProperty.leaseRate || '',
          leaseRateUnit: apiProperty.leaseRateUnit || 'per_sqft_annual',
          leaseType: apiProperty.leaseType || '',
          leaseTerms: apiProperty.leaseTerms || {
            minTerm: '',
            maxTerm: '',
            renewalOptions: '',
            securityDeposit: '',
            personalGuaranteeRequired: false
          },
          grossIncome: apiProperty.grossIncome || '',
          hoaFees: apiProperty.hoaFees || '',
          propertyTaxes: apiProperty.propertyTaxes || '',
          leaseTermsDescription: apiProperty.leaseTermsDescription || '',
          availabilityDate: apiProperty.availabilityDate ? apiProperty.availabilityDate.split('T')[0] : '',
          totalSquareFootage: apiProperty.totalSquareFootage || '',
          availableSquareFootage: apiProperty.availableSquareFootage || '',
          lotSize: apiProperty.lotSize || '',
          lotSizeUnit: apiProperty.lotSizeUnit || 'sqft',
          lotDimensions: apiProperty.lotDimensions || '',
          buildingClass: apiProperty.buildingClass || '',
          yearBuilt: apiProperty.yearBuilt || '',
          renovationYear: apiProperty.renovationYear || '',
          numberOfUnits: apiProperty.numberOfUnits || '',
          ceilingHeight: apiProperty.ceilingHeight || '',
          clearHeight: apiProperty.clearHeight || '',
          floors: apiProperty.floors || '',
          loadingDocks: apiProperty.loadingDocks || '',
          driveInDoors: apiProperty.driveInDoors || '',
          parkingRatio: apiProperty.parkingRatio || '',
          description: apiProperty.description || '',
          zoning: apiProperty.zoning || '',
          parkingSpaces: apiProperty.parkingSpaces || '',
          amenities: apiProperty.amenities || [],
          keyHighlights: apiProperty.keyHighlights || [],
          keyFeatures: apiProperty.keyFeatures || [],
          marketingRemarks: apiProperty.marketingRemarks || '',
          highlights: apiProperty.highlights || '',
          marketingStatus: apiProperty.marketingStatus || 'draft',
          pricePerSquareFoot: apiProperty.pricePerSquareFoot || '',
          ownerName: apiProperty.ownerName || '',
          ownerEmail: apiProperty.ownerEmail || '',
          ownerPhone: apiProperty.ownerPhone || '',
          listingAgent: apiProperty.listingAgent || '',
          brokerage: apiProperty.brokerage || '',
          coBrokerSplit: apiProperty.coBrokerSplit || '',
          transactionStatus: apiProperty.transactionStatus || 'active',
          dateSoldLeased: apiProperty.dateSoldLeased ? apiProperty.dateSoldLeased.split('T')[0] : '',
          finalSalePrice: apiProperty.finalSalePrice || '',
          finalLeaseRate: apiProperty.finalLeaseRate || '',
          buyerTenantName: apiProperty.buyerTenantName || '',
          notes: apiProperty.notes || '',
          images: apiProperty.images || [],
          documents: apiProperty.documents || [],
          floorPlans: apiProperty.floorPlans || [],
          sitePlans: apiProperty.sitePlans || [],
          offeringMemorandum: apiProperty.offeringMemorandum || '',
          brochure: apiProperty.brochure || ''
        });
        
        // Reset unsaved changes flag when property is loaded
        setHasUnsavedChanges(false);
      } else {
        // Property not found in API response
        setError('Property not found');
      }
    } catch (apiError) {
        // Fallback to mock data if API fails
        const property = mockProperty;
        setFormData({
          name: property.name || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zipCode: property.zipCode || '',
          propertyType: property.propertyType || '',
          status: property.status || 'available',
          listingType: property.listingType || 'sale',
          listPrice: property.listPrice || '',
          leaseRate: property.leaseRate || '',
          totalSquareFootage: property.totalSquareFootage || '',
          buildingClass: property.buildingClass || '',
          yearBuilt: property.yearBuilt || '',
          description: property.description || '',
          zoning: property.zoning || '',
          parkingSpaces: property.parkingSpaces || '',
          amenities: property.amenities || [],
          marketingStatus: property.marketingStatus || 'draft',
          pricePerSquareFoot: property.pricePerSquareFoot || '',
          images: property.images || []
        });
        
        // Reset unsaved changes flag when property is loaded (fallback)
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark form as having unsaved changes whenever data is modified
    setHasUnsavedChanges(true);

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFieldBlur = (field) => () => {
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, field]));
    
    // Validate this specific field on blur
    const errors = { ...formErrors };
    
    if (field === 'name' && !formData.name.trim()) {
      errors.name = 'Property name is required';
    } else if (field === 'propertyType' && !formData.propertyType) {
      errors.propertyType = 'Property type is required';
    } else if (field === 'city' && !formData.city.trim()) {
      errors.city = 'City is required';
    } else if (field === 'state' && !formData.state.trim()) {
      errors.state = 'State is required';
    } else if (field === 'listingType' && !formData.listingType) {
      errors.listingType = 'Listing type is required';
    } else if (errors[field]) {
      // Clear error if field is now valid
      delete errors[field];
    }
    
    setFormErrors(errors);
  };

  const handleLeaseTermChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      leaseTerms: {
        ...prev.leaseTerms,
        [field]: value
      }
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToRemove)
    }));
  };

  const handleAddKeyHighlight = () => {
    if (keyHighlightInput.trim() && !formData.keyHighlights.includes(keyHighlightInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keyHighlights: [...prev.keyHighlights, keyHighlightInput.trim()]
      }));
      setKeyHighlightInput('');
    }
  };

  const handleRemoveKeyHighlight = (highlightToRemove) => {
    setFormData(prev => ({
      ...prev,
      keyHighlights: prev.keyHighlights.filter(highlight => highlight !== highlightToRemove)
    }));
  };

  const handleAddKeyFeature = () => {
    if (keyFeatureInput.trim() && !formData.keyFeatures.includes(keyFeatureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, keyFeatureInput.trim()]
      }));
      setKeyFeatureInput('');
    }
  };

  const handleRemoveKeyFeature = (featureToRemove) => {
    setFormData(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter(feature => feature !== featureToRemove)
    }));
  };

  // Floor Plan upload handler
  const handleFloorPlanUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingFloorPlans(true);
      const processedFiles = [];

      for (const file of files) {
        const validation = validateDocumentFile(file);
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: `${file.name}: ${validation.errors[0]}`,
            severity: 'error'
          });
          continue;
        }
        processedFiles.push(file);
      }

      if (processedFiles.length === 0) {
        setUploadingFloorPlans(false);
        return;
      }

      if (!isEditing) {
        setSelectedFloorPlans(prev => [...prev, ...processedFiles]);
        setFormData(prev => ({
          ...prev,
          floorPlans: [...prev.floorPlans, ...processedFiles.map(f => URL.createObjectURL(f))]
        }));
        setUploadingFloorPlans(false);
        return;
      }

      // For existing properties, upload immediately
      const formDataObj = new FormData();
      processedFiles.forEach(file => formDataObj.append('floorPlans', file));
      const response = await propertyApi.uploadFloorPlans(id, processedFiles);

      setFormData(prev => ({
        ...prev,
        floorPlans: [...prev.floorPlans, ...(response.floorPlans || [])]
      }));

      setSnackbar({
        open: true,
        message: `${processedFiles.length} floor plan(s) uploaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload floor plans',
        severity: 'error'
      });
    } finally {
      setUploadingFloorPlans(false);
    }
  };

  const handleRemoveFloorPlan = async (index) => {
    if (!isEditing) {
      const newPlans = formData.floorPlans.filter((_, i) => i !== index);
      const newFiles = selectedFloorPlans.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, floorPlans: newPlans }));
      setSelectedFloorPlans(newFiles);
      return;
    }

    try {
      await propertyApi.removeFloorPlan(id, index);
      const newPlans = formData.floorPlans.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, floorPlans: newPlans }));
      setSnackbar({
        open: true,
        message: 'Floor plan removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove floor plan',
        severity: 'error'
      });
    }
  };

  // Site Plan upload handler
  const handleSitePlanUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingSitePlans(true);
      const processedFiles = [];

      for (const file of files) {
        const validation = validateDocumentFile(file);
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: `${file.name}: ${validation.errors[0]}`,
            severity: 'error'
          });
          continue;
        }
        processedFiles.push(file);
      }

      if (processedFiles.length === 0) {
        setUploadingSitePlans(false);
        return;
      }

      if (!isEditing) {
        setSelectedSitePlans(prev => [...prev, ...processedFiles]);
        setFormData(prev => ({
          ...prev,
          sitePlans: [...prev.sitePlans, ...processedFiles.map(f => URL.createObjectURL(f))]
        }));
        setUploadingSitePlans(false);
        return;
      }

      const response = await propertyApi.uploadSitePlans(id, processedFiles);

      setFormData(prev => ({
        ...prev,
        sitePlans: [...prev.sitePlans, ...(response.sitePlans || [])]
      }));

      setSnackbar({
        open: true,
        message: `${processedFiles.length} site plan(s) uploaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload site plans',
        severity: 'error'
      });
    } finally {
      setUploadingSitePlans(false);
    }
  };

  const handleRemoveSitePlan = async (index) => {
    if (!isEditing) {
      const newPlans = formData.sitePlans.filter((_, i) => i !== index);
      const newFiles = selectedSitePlans.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sitePlans: newPlans }));
      setSelectedSitePlans(newFiles);
      return;
    }

    try {
      await propertyApi.removeSitePlan(id, index);
      const newPlans = formData.sitePlans.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sitePlans: newPlans }));
      setSnackbar({
        open: true,
        message: 'Site plan removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove site plan',
        severity: 'error'
      });
    }
  };

  // Offering Memorandum upload handler
  const handleOfferingMemorandumUpload = async (file) => {
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      setSnackbar({
        open: true,
        message: `${file.name}: ${validation.errors[0]}`,
        severity: 'error'
      });
      return;
    }

    if (!isEditing) {
      setFormData(prev => ({ ...prev, offeringMemorandum: URL.createObjectURL(file) }));
      return;
    }

    try {
      const response = await propertyApi.uploadOfferingMemorandum(id, file);
      setFormData(prev => ({ ...prev, offeringMemorandum: response.offeringMemorandum }));
      setSnackbar({
        open: true,
        message: 'Offering memorandum uploaded successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload offering memorandum',
        severity: 'error'
      });
    }
  };

  const handleRemoveOfferingMemorandum = async () => {
    if (!isEditing) {
      setFormData(prev => ({ ...prev, offeringMemorandum: '' }));
      return;
    }

    try {
      await propertyApi.removeOfferingMemorandum(id);
      setFormData(prev => ({ ...prev, offeringMemorandum: '' }));
      setSnackbar({
        open: true,
        message: 'Offering memorandum removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove offering memorandum',
        severity: 'error'
      });
    }
  };

  // Brochure upload handler
  const handleBrochureUpload = async (file) => {
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      setSnackbar({
        open: true,
        message: `${file.name}: ${validation.errors[0]}`,
        severity: 'error'
      });
      return;
    }

    if (!isEditing) {
      setFormData(prev => ({ ...prev, brochure: URL.createObjectURL(file) }));
      return;
    }

    try {
      const response = await propertyApi.uploadBrochure(id, file);
      setFormData(prev => ({ ...prev, brochure: response.brochure }));
      setSnackbar({
        open: true,
        message: 'Brochure uploaded successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload brochure',
        severity: 'error'
      });
    }
  };

  const handleRemoveBrochure = async () => {
    if (!isEditing) {
      setFormData(prev => ({ ...prev, brochure: '' }));
      return;
    }

    try {
      await propertyApi.removeBrochure(id);
      setFormData(prev => ({ ...prev, brochure: '' }));
      setSnackbar({
        open: true,
        message: 'Brochure removed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove brochure',
        severity: 'error'
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields only: Property Name, Property Type, City, State, Listing Type
    if (!formData.name.trim()) {
      errors.name = 'Property name is required';
    }
    
    if (!formData.propertyType) {
      errors.propertyType = 'Property type is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!formData.listingType) {
      errors.listingType = 'Listing type is required';
    }

    // All other fields are optional - no additional validation needed
    setFormErrors(errors);
    
    // Mark all required fields as touched if validation fails
    if (Object.keys(errors).length > 0) {
      const requiredFields = ['name', 'propertyType', 'city', 'state', 'listingType'];
      setTouchedFields(prev => new Set([...prev, ...requiredFields]));
      
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      setTimeout(() => {
        // Try multiple selectors to find the error field
        let errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (!errorElement) {
          errorElement = document.querySelector(`#${firstErrorField}`);
        }
        if (!errorElement) {
          errorElement = document.querySelector(`[id="${firstErrorField}"]`);
        }
        if (!errorElement && firstErrorField === 'propertyType') {
          errorElement = document.querySelector(`[id="propertyType"]`);
        }
        if (!errorElement && firstErrorField === 'listingType') {
          errorElement = document.querySelector(`[id="listingType"]`);
        }
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (errorElement.focus) {
            errorElement.focus();
          }
        }
      }, 100);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent duplicate submissions on double-click
    if (saving) {
      console.log('Form submission already in progress, ignoring duplicate submit');
      return;
    }
    
    // Validate form - this will mark all required fields as touched and scroll to first error
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please complete all required fields before submitting',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Convert string numbers to actual numbers
      const propertyData = {
        ...formData,
        listPrice: formData.listPrice ? parseFloat(formData.listPrice) : null,
        leaseRate: formData.leaseRate ? parseFloat(formData.leaseRate) : null,
        totalSquareFootage: formData.totalSquareFootage ? parseInt(formData.totalSquareFootage) : null,
        availableSquareFootage: formData.availableSquareFootage ? parseInt(formData.availableSquareFootage) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        renovationYear: formData.renovationYear ? parseInt(formData.renovationYear) : null,
        numberOfUnits: formData.numberOfUnits ? parseInt(formData.numberOfUnits) : null,
        ceilingHeight: formData.ceilingHeight ? parseFloat(formData.ceilingHeight) : null,
        clearHeight: formData.clearHeight ? parseFloat(formData.clearHeight) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        loadingDocks: formData.loadingDocks ? parseInt(formData.loadingDocks) : null,
        driveInDoors: formData.driveInDoors ? parseInt(formData.driveInDoors) : null,
        parkingSpaces: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : null,
        parkingRatio: formData.parkingRatio ? parseFloat(formData.parkingRatio) : null,
        pricePerSquareFoot: formData.pricePerSquareFoot ? parseFloat(formData.pricePerSquareFoot) : null,
        grossIncome: formData.grossIncome ? parseFloat(formData.grossIncome) : null,
        hoaFees: formData.hoaFees ? parseFloat(formData.hoaFees) : null,
        propertyTaxes: formData.propertyTaxes ? parseFloat(formData.propertyTaxes) : null,
        coBrokerSplit: formData.coBrokerSplit ? parseFloat(formData.coBrokerSplit) : null,
        finalSalePrice: formData.finalSalePrice ? parseFloat(formData.finalSalePrice) : null,
        finalLeaseRate: formData.finalLeaseRate ? parseFloat(formData.finalLeaseRate) : null
      };

      let response;
      let uploadedImageUrls = [];
      if (isEditing) {
        response = await propertyApi.updateProperty(id, propertyData);
      } else {
        response = await propertyApi.createProperty(propertyData);

        // Upload files for new properties
        const propertyId = response.property?.id || response.id;

        if (propertyId) {
          // Upload images if any
          if (selectedFiles.length > 0) {
            try {
              const uploadRes = await propertyApi.uploadImages(propertyId, selectedFiles);
              // Normalize different backend shapes
              const urls = uploadRes?.images || uploadRes?.photos?.map(p => p.url) || [];
              uploadedImageUrls = urls;
            } catch (uploadError) {
              // Image upload failed, continue anyway
            }
          }

          // Upload documents if any
          if (selectedDocuments.length > 0) {
            try {
              await propertyApi.uploadDocuments(propertyId, selectedDocuments);
            } catch (uploadError) {
              // Document upload failed, continue anyway
            }
          }
        }
      }

      // Mark form as saved (no unsaved changes)
      setHasUnsavedChanges(false);

      // Get the property ID from response
      const propertyId = response?.property?.id || response?.id || response?.data?.id || id;
      
      if (isEditing) {
        // For updates, show success message and keep on same page
        setSnackbar({
          open: true,
          message: 'Property updated successfully',
          severity: 'success'
        });

        // Call the onUpdate callback if provided
        if (location.state?.onUpdate) {
          location.state.onUpdate();
        }
      } else {
        // For new properties, redirect to Property Detail page
        if (propertyId) {
          console.log('Property created successfully, redirecting to detail page:', propertyId);
          // Navigate to property detail page
          navigate(`/properties/${propertyId}`, { replace: true });
        } else {
          // Fallback: if no ID returned, go to properties list
          console.warn('Property created but no ID returned, redirecting to properties list');
          const createdBase = response?.property || null;
          const created = createdBase && uploadedImageUrls.length > 0
            ? { ...createdBase, images: [...(createdBase.images || []), ...uploadedImageUrls] }
            : createdBase;
          navigate('/properties', { replace: true, state: { justCreated: true, newProperty: created } });
        }
      }

    } catch (err) {
      // Log error for debugging
      console.error('Error creating/updating property:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });

      // Show clear error message
      let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} property`;
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = `${errorMessage}: ${err.message}`;
      }

      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/properties');
      }
    } else {
      navigate('/properties');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Properties
        </Button>
        
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEditing ? 'Edit Property' : 'Add New Property'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1.5}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Home sx={{ mr: 0.5, fontSize: 20 }} />
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Property Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                onBlur={handleFieldBlur('name')}
                error={!!formErrors.name && touchedFields.has('name')}
                helperText={touchedFields.has('name') ? formErrors.name : ''}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required error={!!formErrors.propertyType && touchedFields.has('propertyType')}>
                <InputLabel id="propertyType-label">Property Type</InputLabel>
                <Select
                  labelId="propertyType-label"
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  label="Property Type"
                  onChange={(e) => {
                    handleInputChange('propertyType')(e);
                    handleFieldBlur('propertyType')();
                  }}
                  onBlur={handleFieldBlur('propertyType')}
                >
                  {propertyTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.propertyType && touchedFields.has('propertyType') && (
                  <FormHelperText>{formErrors.propertyType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!formErrors.propertyStatus}>
                <InputLabel>Property Status</InputLabel>
                <Select
                  value={formData.propertyStatus}
                  label="Property Status"
                  onChange={handleInputChange('propertyStatus')}
                >
                  {propertyStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.propertyStatus && (
                  <FormHelperText>{formErrors.propertyStatus}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Listing Date"
                type="date"
                value={formData.listingDate}
                onChange={handleInputChange('listingDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={handleInputChange('expirationDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Internal Property ID"
                value={formData.internalPropertyId}
                onChange={handleInputChange('internalPropertyId')}
                helperText="Optional internal tracking ID"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="MLS Number"
                value={formData.mlsNumber}
                onChange={handleInputChange('mlsNumber')}
                helperText="Multiple Listing Service number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="County"
                value={formData.county}
                onChange={handleInputChange('county')}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 20 }} />
                Location
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!formErrors.address}
                helperText={formErrors.address}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange('city')}
                onBlur={handleFieldBlur('city')}
                error={!!formErrors.city && touchedFields.has('city')}
                helperText={touchedFields.has('city') ? formErrors.city : ''}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange('state')}
                onBlur={handleFieldBlur('state')}
                error={!!formErrors.state && touchedFields.has('state')}
                helperText={touchedFields.has('state') ? formErrors.state : ''}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
                error={!!formErrors.zipCode}
                helperText={formErrors.zipCode}
              />
            </Grid>

            {/* Financials */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <AttachMoney sx={{ mr: 0.5, fontSize: 20 }} />
                Financials
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required error={!!formErrors.listingType && touchedFields.has('listingType')}>
                <InputLabel id="listingType-label">Listing Type</InputLabel>
                <Select
                  labelId="listingType-label"
                  id="listingType"
                  name="listingType"
                  value={formData.listingType}
                  label="Listing Type"
                  onChange={(e) => {
                    handleInputChange('listingType')(e);
                    handleFieldBlur('listingType')();
                  }}
                  onBlur={handleFieldBlur('listingType')}
                >
                  <MenuItem value="sale">For Sale</MenuItem>
                  <MenuItem value="lease">For Lease</MenuItem>
                </Select>
                {formErrors.listingType && touchedFields.has('listingType') && (
                  <FormHelperText>{formErrors.listingType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange('status')}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.listingType === 'sale' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="List Price"
                  type="number"
                  value={formData.listPrice}
                  onChange={handleInputChange('listPrice')}
                  error={!!formErrors.listPrice}
                  helperText={formErrors.listPrice}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
            )}

            {formData.listingType === 'lease' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Lease Rate"
                    type="number"
                    value={formData.leaseRate}
                    onChange={handleInputChange('leaseRate')}
                    error={!!formErrors.leaseRate}
                    helperText={formErrors.leaseRate}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Lease Rate Unit</InputLabel>
                    <Select
                      value={formData.leaseRateUnit}
                      label="Lease Rate Unit"
                      onChange={handleInputChange('leaseRateUnit')}
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="annual">Annual</MenuItem>
                      <MenuItem value="per_sqft_monthly">Per Sq Ft Monthly</MenuItem>
                      <MenuItem value="per_sqft_annual">Per Sq Ft Annual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Lease Type</InputLabel>
                    <Select
                      value={formData.leaseType}
                      label="Lease Type"
                      onChange={handleInputChange('leaseType')}
                    >
                      <MenuItem value="NNN">NNN (Triple Net)</MenuItem>
                      <MenuItem value="Gross">Gross</MenuItem>
                      <MenuItem value="Modified">Modified</MenuItem>
                      <MenuItem value="Full Service">Full Service</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Availability Date"
                    type="date"
                    value={formData.availabilityDate}
                    onChange={handleInputChange('availabilityDate')}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price per Square Foot"
                type="number"
                value={formData.pricePerSquareFoot}
                onChange={handleInputChange('pricePerSquareFoot')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gross Income"
                type="number"
                value={formData.grossIncome}
                onChange={handleInputChange('grossIncome')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Annual gross income"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HOA Fees"
                type="number"
                value={formData.hoaFees}
                onChange={handleInputChange('hoaFees')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Monthly HOA fees"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Property Taxes"
                type="number"
                value={formData.propertyTaxes}
                onChange={handleInputChange('propertyTaxes')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Annual property taxes"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lease Terms Description"
                value={formData.leaseTermsDescription}
                onChange={handleInputChange('leaseTermsDescription')}
                helperText="e.g., 3-year NNN lease"
              />
            </Grid>

            {/* Property Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Apartment sx={{ mr: 0.5, fontSize: 20 }} />
                Property Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Square Footage"
                type="number"
                value={formData.totalSquareFootage}
                onChange={handleInputChange('totalSquareFootage')}
                error={!!formErrors.totalSquareFootage}
                helperText={formErrors.totalSquareFootage}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Lot Size Unit</InputLabel>
                <Select
                  value={formData.lotSizeUnit}
                  label="Lot Size Unit"
                  onChange={handleInputChange('lotSizeUnit')}
                >
                  {lotSizeUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Building Class</InputLabel>
                <Select
                  value={formData.buildingClass}
                  label="Building Class"
                  onChange={handleInputChange('buildingClass')}
                >
                  {buildingClasses.map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      Class {cls}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Year Built"
                type="number"
                value={formData.yearBuilt}
                onChange={handleInputChange('yearBuilt')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Renovation Year"
                type="number"
                value={formData.renovationYear}
                onChange={handleInputChange('renovationYear')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Number of Units"
                type="number"
                value={formData.numberOfUnits}
                onChange={handleInputChange('numberOfUnits')}
                helperText="For multifamily properties"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ceiling Height (ft)"
                type="number"
                value={formData.ceilingHeight}
                onChange={handleInputChange('ceilingHeight')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Parking Spaces"
                type="number"
                value={formData.parkingSpaces}
                onChange={handleInputChange('parkingSpaces')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Available Square Footage"
                type="number"
                value={formData.availableSquareFootage}
                onChange={handleInputChange('availableSquareFootage')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">Sq Ft</InputAdornment>
                }}
                helperText="Available/leasable square footage"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lot Size"
                type="number"
                value={formData.lotSize}
                onChange={handleInputChange('lotSize')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{formData.lotSizeUnit === 'acres' ? 'Acres' : 'Sq Ft'}</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parking Ratio (spaces per 1000 SF)"
                type="number"
                value={formData.parkingRatio}
                onChange={handleInputChange('parkingRatio')}
                inputProps={{ step: 0.01 }}
                helperText="e.g., 4.0 = 4 spaces per 1000 sq ft"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Clear Height"
                type="number"
                value={formData.clearHeight}
                onChange={handleInputChange('clearHeight')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">ft</InputAdornment>
                }}
                inputProps={{ step: 0.1 }}
                helperText="Warehouse/industrial clear height"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Number of Floors"
                type="number"
                value={formData.floors}
                onChange={handleInputChange('floors')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Loading Docks"
                type="number"
                value={formData.loadingDocks}
                onChange={handleInputChange('loadingDocks')}
                helperText="Number of loading docks"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Drive-in Doors"
                type="number"
                value={formData.driveInDoors}
                onChange={handleInputChange('driveInDoors')}
                helperText="Number of drive-in doors"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lot Dimensions"
                value={formData.lotDimensions}
                onChange={handleInputChange('lotDimensions')}
                placeholder="Dimensions"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zoning"
                value={formData.zoning}
                onChange={handleInputChange('zoning')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Marketing Status</InputLabel>
                <Select
                  value={formData.marketingStatus}
                  label="Marketing Status"
                  onChange={handleInputChange('marketingStatus')}
                >
                  {marketingStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                helperText="Describe the property features, location benefits, and other relevant details"
              />
            </Grid>

            {/* Lease Terms - only show for lease properties */}
            {formData.listingType === 'lease' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Lease Terms
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Minimum Term (months)"
                    type="number"
                    value={formData.leaseTerms.minTerm}
                    onChange={handleLeaseTermChange('minTerm')}
                    helperText="Minimum lease duration in months"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maximum Term (months)"
                    type="number"
                    value={formData.leaseTerms.maxTerm}
                    onChange={handleLeaseTermChange('maxTerm')}
                    helperText="Maximum lease duration in months"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Security Deposit"
                    type="number"
                    value={formData.leaseTerms.securityDeposit}
                    onChange={handleLeaseTermChange('securityDeposit')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    helperText="Security deposit amount"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Renewal Options"
                    value={formData.leaseTerms.renewalOptions}
                    onChange={handleLeaseTermChange('renewalOptions')}
                    helperText="e.g., 2x5 year options"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.leaseTerms.personalGuaranteeRequired}
                        onChange={handleLeaseTermChange('personalGuaranteeRequired')}
                      />
                    }
                    label="Personal Guarantee Required"
                  />
                </Grid>
              </>
            )}

            {/* Amenities */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Amenities
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add amenity"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddAmenity}
                  sx={{ minWidth: 'auto' }}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.amenities.map((amenity, index) => (
                  <Chip
                    key={index}
                    label={amenity}
                    onDelete={() => handleRemoveAmenity(amenity)}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Contacts Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ContactPhone sx={{ mr: 0.5, fontSize: 20 }} />
                Contacts
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Name"
                value={formData.ownerName}
                onChange={handleInputChange('ownerName')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Email"
                type="email"
                value={formData.ownerEmail}
                onChange={handleInputChange('ownerEmail')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Phone"
                value={formData.ownerPhone}
                onChange={handleInputChange('ownerPhone')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Listing Agent"
                value={formData.listingAgent}
                onChange={handleInputChange('listingAgent')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Brokerage"
                value={formData.brokerage}
                onChange={handleInputChange('brokerage')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Co-Broker Split (%)"
                type="number"
                value={formData.coBrokerSplit}
                onChange={handleInputChange('coBrokerSplit')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>
                }}
                helperText="Commission split percentage"
              />
            </Grid>

            {/* Marketing Info Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <DescriptionIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Marketing Info
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Key Highlights
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add key highlight"
                  value={keyHighlightInput}
                  onChange={(e) => setKeyHighlightInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyHighlight();
                    }
                  }}
                  helperText="e.g., Recently renovated, Prime location, Class A building"
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddKeyHighlight}
                  sx={{ minWidth: 'auto' }}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.keyHighlights.map((highlight, index) => (
                  <Chip
                    key={index}
                    label={highlight}
                    onDelete={() => handleRemoveKeyHighlight(highlight)}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Key Features
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add key feature"
                  value={keyFeatureInput}
                  onChange={(e) => setKeyFeatureInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyFeature();
                    }
                  }}
                  helperText="e.g., High ceilings, Natural lighting, Modern finishes"
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddKeyFeature}
                  sx={{ minWidth: 'auto' }}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.keyFeatures.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => handleRemoveKeyFeature(feature)}
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Marketing Remarks"
                multiline
                rows={4}
                value={formData.marketingRemarks}
                onChange={handleInputChange('marketingRemarks')}
                helperText="Marketing and promotional remarks for the property"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Highlights"
                multiline
                rows={4}
                value={formData.highlights}
                onChange={handleInputChange('highlights')}
                helperText="Property highlights and notable features in paragraph format"
              />
            </Grid>

            {/* Property Photos Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Photo sx={{ mr: 0.5, fontSize: 20 }} />
                Property Photos
              </Typography>

              {/* Photo Upload Dropzone */}
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 3,
                  outline: isDragActive ? '3px solid' : 'none',
                  outlineColor: 'primary.main',
                  backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop photos here' : 'Upload Property Photos'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drag & drop photos here, or click to select files
                  <br />
                  Supports: JPG, PNG, GIF, WebP (max 10MB each)
                  <br />
                  Images are automatically compressed for optimal performance
                </Typography>
                {selectedFiles.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
                    {selectedFiles.slice(0, 6).map((file, idx) => (
                      <Box key={idx} sx={{ width: 64, height: 64, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'grey.300' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`preview-${idx}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
                {uploadingImages && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading photos...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Photo Gallery */}
              {formData.images && formData.images.length > 0 && (
                <Box>
                  <ImageGallery
                    images={formData.images}
                    title={`Property Photos (${formData.images.length})`}
                    showThumbnails={true}
                    showFullscreenButton={true}
                    showIndex={true}
                    maxHeight="400px"
                    renderCustomControls={({ currentIndex, totalImages }) => (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleRemoveImage(currentIndex)}
                        >
                          Remove Current Image
                        </Button>
                      </Box>
                    )}
                  />
                </Box>
              )}
            </Grid>

            {/* Property Documents Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Business sx={{ mr: 0.5, fontSize: 20 }} />
                Property Documents
              </Typography>

              {/* Document Upload Dropzone */}
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 3,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
                onClick={() => document.getElementById('document-input').click()}
              >
                <input
                  id="document-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpeg,.jpg,.png,.gif,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleDocumentUpload(Array.from(e.target.files));
                      e.target.value = ''; // Reset input
                    }
                  }}
                />

                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Property Documents
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to select documents or drag & drop files here
                  <br />
                  Supports: PDF, DOC, DOCX, XLS, XLSX, TXT, Images (max 25MB each)
                </Typography>
                {uploadingDocuments && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Processing documents...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Document List */}
              {formData.documents && formData.documents.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Uploaded Documents ({formData.documents.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.documents.map((doc, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ p: 2, height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Business sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
                              {doc.name}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveDocument(index)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {doc.type} • {doc.size ? (doc.size / 1024 / 1024).toFixed(1) + 'MB' : 'Unknown size'}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Floor Plans Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Floor Plans
              </Typography>

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 3,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
                onClick={() => document.getElementById('floorplan-input').click()}
              >
                <input
                  id="floorplan-input"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFloorPlanUpload(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Floor Plans
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to select floor plans
                  <br />
                  Supports: PDF, JPG, PNG (max 25MB each)
                </Typography>
                {uploadingFloorPlans && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading floor plans...
                    </Typography>
                  </Box>
                )}
              </Box>

              {formData.floorPlans && formData.floorPlans.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Uploaded Floor Plans ({formData.floorPlans.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.floorPlans.map((plan, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ p: 2, height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
                              Floor Plan {index + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveFloorPlan(index)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Site Plans Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Site Plans
              </Typography>

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 3,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
                onClick={() => document.getElementById('siteplan-input').click()}
              >
                <input
                  id="siteplan-input"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleSitePlanUpload(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
                <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Site Plans
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to select site plans
                  <br />
                  Supports: PDF, JPG, PNG (max 25MB each)
                </Typography>
                {uploadingSitePlans && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading site plans...
                    </Typography>
                  </Box>
                )}
              </Box>

              {formData.sitePlans && formData.sitePlans.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Uploaded Site Plans ({formData.sitePlans.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {formData.sitePlans.map((plan, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ p: 2, height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
                              Site Plan {index + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveSitePlan(index)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Offering Memorandum */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Offering Memorandum
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  {formData.offeringMemorandum ? 'Replace Offering Memorandum' : 'Upload Offering Memorandum'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleOfferingMemorandumUpload(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </Button>
                {formData.offeringMemorandum && (
                  <IconButton
                    color="error"
                    onClick={handleRemoveOfferingMemorandum}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
              {formData.offeringMemorandum && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ✓ Offering Memorandum uploaded
                </Typography>
              )}
            </Grid>

            {/* Brochure */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Property Brochure
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  {formData.brochure ? 'Replace Brochure' : 'Upload Brochure'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBrochureUpload(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </Button>
                {formData.brochure && (
                  <IconButton
                    color="error"
                    onClick={handleRemoveBrochure}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
              {formData.brochure && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ✓ Brochure uploaded
                </Typography>
              )}
            </Grid>

            {/* Transaction Info Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 0.5, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <AccountBalance sx={{ mr: 0.5, fontSize: 20 }} />
                Transaction Info
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Transaction Status</InputLabel>
                <Select
                  value={formData.transactionStatus}
                  label="Transaction Status"
                  onChange={handleInputChange('transactionStatus')}
                >
                  {transactionStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Sold/Leased"
                type="date"
                value={formData.dateSoldLeased}
                onChange={handleInputChange('dateSoldLeased')}
                InputLabelProps={{ shrink: true }}
                helperText="Date transaction was completed"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Final Sale Price"
                type="number"
                value={formData.finalSalePrice}
                onChange={handleInputChange('finalSalePrice')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Actual sale price (if sold)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Final Lease Rate"
                type="number"
                value={formData.finalLeaseRate}
                onChange={handleInputChange('finalLeaseRate')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                helperText="Actual lease rate (if leased)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buyer/Tenant Name"
                value={formData.buyerTenantName}
                onChange={handleInputChange('buyerTenantName')}
                helperText="Name of buyer or tenant"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleInputChange('notes')}
                helperText="Additional transaction notes or comments"
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBack}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (isEditing ? 'Update Property' : 'Create Property')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertyForm;