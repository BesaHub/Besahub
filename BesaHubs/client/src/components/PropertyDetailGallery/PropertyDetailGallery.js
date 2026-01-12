import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close
} from '@mui/icons-material';
import ImageGallery from '../ImageGallery';

const PropertyDetailGallery = ({
  images = [],
  mainImage,
  onImageClick,
  maxImages = 6,
  showFullGalleryButton = true,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fullGalleryOpen, setFullGalleryOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  // Filter out blob URLs and format valid images
  const validImages = images.filter(img => {
    const url = typeof img === 'string' ? img : img.url || img.src;
    return url && !url.startsWith('blob:');
  });
  
  const displayImages = validImages.slice(0, maxImages);
  const remainingCount = validImages.length - maxImages;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setFullGalleryOpen(true);
    if (onImageClick) {
      onImageClick(validImages[index], index);
    }
  };

  const formatImageUrl = (image) => {
    const imageUrl = typeof image === 'string' ? image : image.url || image.src;
    
    // Skip blob URLs (temporary browser URLs)
    if (imageUrl.startsWith('blob:')) {
      return null;
    }
    
    // If already full URL, use as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // For relative paths, use the current origin (works in Replit)
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  if (!validImages || validImages.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        {/* Main Image */}
        <Box sx={{ mb: 2 }}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'scale(1.02)',
                transition: 'all 0.3s ease-in-out'
              }
            }}
            onClick={() => handleImageClick(0)}
          >
            <CardMedia
              component="img"
              height={isMobile ? 250 : 400}
              image={formatImageUrl(mainImage || validImages[0])}
              alt="Main property image"
              sx={{
                objectFit: 'cover',
                borderRadius: theme.shape.borderRadius
              }}
            />
          </Card>
        </Box>

        {/* Thumbnail Grid */}
        {displayImages.length > 1 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ?
                'repeat(3, 1fr)' :
                'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 1,
              maxHeight: isMobile ? 120 : 150,
              overflow: 'hidden'
            }}
          >
            {displayImages.slice(1).map((image, index) => (
              <Card
                key={index + 1}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => handleImageClick(index + 1)}
              >
                <CardMedia
                  component="img"
                  height={isMobile ? 80 : 120}
                  image={formatImageUrl(image)}
                  alt={`Property image ${index + 2}`}
                  sx={{
                    objectFit: 'cover',
                    borderRadius: theme.shape.borderRadius
                  }}
                />

                {/* Show remaining count on last thumbnail */}
                {index === displayImages.slice(1).length - 1 && remainingCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderRadius: theme.shape.borderRadius
                    }}
                  >
                    +{remainingCount}
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Full Gallery Dialog */}
      <Dialog
        open={fullGalleryOpen}
        onClose={() => setFullGalleryOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            maxWidth: '95vw',
            maxHeight: '95vh',
            m: 1
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setFullGalleryOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <Close />
          </IconButton>

          <ImageGallery
            images={validImages}
            showThumbnails={!isMobile}
            showFullscreenButton={true}
            showIndex={true}
            startIndex={selectedImageIndex}
            maxHeight="80vh"
            autoPlay={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyDetailGallery;