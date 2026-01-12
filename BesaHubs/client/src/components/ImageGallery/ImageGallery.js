import React, { useState, useEffect } from 'react';
import ImageGallery from 'react-image-gallery';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  PhotoLibrary
} from '@mui/icons-material';
import 'react-image-gallery/styles/css/image-gallery.css';

const CustomImageGallery = ({
  images = [],
  title,
  showThumbnails = true,
  showFullscreenButton = true,
  showPlayButton = false,
  autoPlay = false,
  slideInterval = 3000,
  showIndex = true,
  loading = false,
  maxHeight = '500px',
  onImageLoad,
  onImageError,
  renderCustomControls,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format images for react-image-gallery
  const formatImages = (imageList) => {
    return imageList.map((image, index) => {
      const imageUrl = typeof image === 'string' ? image : image.url || image.src;
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:3001${imageUrl}`;

      return {
        original: fullUrl,
        thumbnail: fullUrl,
        description: image.description || image.caption || `Image ${index + 1}`,
        alt: image.alt || `Property image ${index + 1}`,
        originalAlt: image.alt || `Property image ${index + 1}`,
        thumbnailAlt: image.alt || `Property image ${index + 1}`,
      };
    });
  };

  const formattedImages = formatImages(images);

  const handleFullscreenChange = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSlide = (currentIndex) => {
    setCurrentIndex(currentIndex);
  };

  const customLeftNav = (onClick, disabled) => (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        '&.disabled': {
          opacity: 0.3,
        }
      }}
      size={isMobile ? 'small' : 'medium'}
    >
      <span>‹</span>
    </IconButton>
  );

  const customRightNav = (onClick, disabled) => (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        '&.disabled': {
          opacity: 0.3,
        }
      }}
      size={isMobile ? 'small' : 'medium'}
    >
      <span>›</span>
    </IconButton>
  );

  const renderCustomItem = (item) => (
    <div className="image-gallery-image">
      <img
        src={item.original}
        alt={item.originalAlt}
        onLoad={onImageLoad}
        onError={onImageError}
        style={{
          maxHeight: maxHeight,
          width: '100%',
          objectFit: 'cover',
          borderRadius: theme.shape.borderRadius
        }}
      />
      {item.description && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            color: 'white',
            p: 2,
            borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`
          }}
        >
          <Typography variant="body2">
            {item.description}
          </Typography>
        </Box>
      )}
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <PhotoLibrary sx={{ mr: 1 }} />
            {title}
          </Typography>
        )}
        <Skeleton
          variant="rectangular"
          height={maxHeight}
          sx={{ borderRadius: theme.shape.borderRadius, mb: 2 }}
        />
        {showThumbnails && (
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                width={80}
                height={60}
                sx={{ borderRadius: theme.shape.borderRadius, flexShrink: 0 }}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          color: 'text.secondary',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: theme.shape.borderRadius,
          backgroundColor: 'background.paper'
        }}
      >
        <PhotoLibrary sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
        <Typography variant="body1">
          No images available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Header */}
      {(title || showIndex) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title && (
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <PhotoLibrary sx={{ mr: 1 }} />
              {title}
            </Typography>
          )}
          {showIndex && formattedImages.length > 0 && (
            <Chip
              label={`${currentIndex + 1} of ${formattedImages.length}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {/* Custom Controls */}
      {renderCustomControls && (
        <Box sx={{ mb: 2 }}>
          {renderCustomControls({ currentIndex, totalImages: formattedImages.length })}
        </Box>
      )}

      {/* Gallery */}
      <Box
        sx={{
          '& .image-gallery': {
            backgroundColor: 'transparent',
          },
          '& .image-gallery-content': {
            borderRadius: theme.shape.borderRadius,
            overflow: 'hidden',
          },
          '& .image-gallery-slide': {
            borderRadius: theme.shape.borderRadius,
          },
          '& .image-gallery-thumbnails-wrapper': {
            marginTop: theme.spacing(1),
          },
          '& .image-gallery-thumbnail': {
            borderRadius: theme.shape.borderRadius,
            border: `2px solid ${theme.palette.divider}`,
            '&.active': {
              border: `2px solid ${theme.palette.primary.main}`,
            }
          },
          '& .image-gallery-icon': {
            color: theme.palette.common.white,
            '&:hover': {
              color: theme.palette.primary.main,
            }
          },
          '& .image-gallery-left-nav, & .image-gallery-right-nav': {
            display: 'none', // Hide default nav buttons
          }
        }}
      >
        <ImageGallery
          items={formattedImages}
          showThumbnails={showThumbnails && !isMobile}
          showFullscreenButton={showFullscreenButton}
          showPlayButton={showPlayButton}
          autoPlay={autoPlay}
          slideInterval={slideInterval}
          onSlide={handleSlide}
          onScreenChange={handleFullscreenChange}
          renderLeftNav={customLeftNav}
          renderRightNav={customRightNav}
          renderItem={renderCustomItem}
          thumbnailPosition={isMobile ? 'bottom' : 'bottom'}
          useBrowserFullscreen={true}
          showNav={formattedImages.length > 1}
          showBullets={isMobile && formattedImages.length > 1}
          infinite={formattedImages.length > 1}
          lazyLoad={true}
          {...props}
        />
      </Box>

      {/* Mobile Thumbnails */}
      {isMobile && showThumbnails && formattedImages.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.divider,
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
            },
          }}
        >
          {formattedImages.map((image, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                minWidth: 80,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: currentIndex === index ?
                  `2px solid ${theme.palette.primary.main}` :
                  `2px solid ${theme.palette.divider}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <img
                src={image.thumbnail}
                alt={image.thumbnailAlt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CustomImageGallery;