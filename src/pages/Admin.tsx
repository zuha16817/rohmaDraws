import React, { useState } from 'react';
import { Package, ShoppingBag, MessageSquare, Plus, Check, Clock, Pencil, Trash2, X, AlertTriangle, Upload, Image as ImageIcon, Sliders, Palette, FileText, Sparkles, RefreshCw, Lock, ToggleLeft, ToggleRight, ExternalLink, Mail, User, DollarSign, Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { Product } from '../types';
import { compressImage, processFileToCompressedDataUrl } from '../utils/imageCompressor';

interface AdminProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct?: (p: Product) => void;
  onDeleteProduct?: (id: number) => void;
  commissionCardImage?: string;
  onUpdateCommissionImage?: (imgUrl: string) => void;
  commissionsOpen?: boolean;
  onToggleCommissionsOpen?: (val: boolean) => void;
  commissionRequests?: any[];
  onRefreshCommissions?: () => void;
  onUpdateCommissionStatus?: (id: number, status: string) => void;
  onDeleteCommissionRequest?: (id: number) => void;
  orders?: any[];
  onRefreshOrders?: () => void;
  onUpdateOrderStatus?: (id: number, status: string) => void;
  onDeleteOrder?: (id: number) => void;
}

export const Admin: React.FC<AdminProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  commissionCardImage = '/images/artwork_flowers_pink.png',
  onUpdateCommissionImage,
  commissionsOpen = true,
  onToggleCommissionsOpen,
  commissionRequests = [],
  onRefreshCommissions,
  onUpdateCommissionStatus,
  onDeleteCommissionRequest,
  orders = [],
  onRefreshOrders,
  onUpdateOrderStatus,
  onDeleteOrder
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'showcase' | 'orders' | 'commissions'>('inventory');
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'original' | 'print_digital'>('all');
  
  // Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('1500');
  const [newType, setNewType] = useState<'original' | 'print' | 'digital'>('original');
  const [newWeight, setNewWeight] = useState('2.5');
  const [newDesc, setNewDesc] = useState('');
  const [newDims, setNewDims] = useState('100cm x 80cm');
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [newSecondaryImages, setNewSecondaryImages] = useState<string[]>([]);
  const [isCompressingNew, setIsCompressingNew] = useState(false);
  
  const [isSavingNew, setIsSavingNew] = useState(false);
  
  // Format Edition Controls (New Product)
  const [newAllowOriginal, setNewAllowOriginal] = useState(true);
  const [newAllowPrint, setNewAllowPrint] = useState(true);
  const [newAllowDigital, setNewAllowDigital] = useState(true);
  const [newPrintPrice, setNewPrintPrice] = useState('240');
  const [newDigitalPrice, setNewDigitalPrice] = useState('15');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editType, setEditType] = useState<'original' | 'print' | 'digital'>('original');
  const [editWeight, setEditWeight] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDims, setEditDims] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSecondaryImages, setEditSecondaryImages] = useState<string[]>([]);
  const [editBadge, setEditBadge] = useState<"AVAILABLE" | "SOLD" | "LIMITED EDITION" | "INSTANT DOWNLOAD">('AVAILABLE');
  const [isCompressingEdit, setIsCompressingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Format Edition Controls (Edit Product)
  const [editAllowOriginal, setEditAllowOriginal] = useState(true);
  const [editAllowPrint, setEditAllowPrint] = useState(true);
  const [editAllowDigital, setEditAllowDigital] = useState(true);
  const [editPrintPrice, setEditPrintPrice] = useState('240');
  const [editDigitalPrice, setEditDigitalPrice] = useState('15');

  // Delete Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Reference Image Preview Modal
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

  // Showcase Picture Manager Upload State
  const [isCompressingShowcase, setIsCompressingShowcase] = useState(false);

  // Filtered collections
  const originalArtworks = products.filter((p) => p.type === 'original');
  const printDigitalArtworks = products.filter((p) => p.type === 'print' || p.type === 'digital');

  // Showcase image upload reader
  const handleShowcaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpdateCommissionImage) {
      const file = e.target.files[0];
      setIsCompressingShowcase(true);
      try {
        const compressed = await processFileToCompressedDataUrl(file, 1200, 1200, 0.85);
        if (compressed) {
          onUpdateCommissionImage(compressed);
        }
      } catch (err) {
        console.error('Showcase image compression failed', err);
      } finally {
        setIsCompressingShowcase(false);
      }
    }
  };

  // Multi-Image Upload Reader for New Product with automatic compression
  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setIsCompressingNew(true);
      try {
        const compressedList: string[] = [];
        for (const file of files) {
          const compressed = await processFileToCompressedDataUrl(file, 1200, 1200, 0.84);
          if (compressed) {
            compressedList.push(compressed);
          }
        }
        if (compressedList.length > 0) {
          if (!newImagePreview) {
            setNewImagePreview(compressedList[0]);
            if (compressedList.length > 1) {
              setNewSecondaryImages(prev => [...prev, ...compressedList.slice(1)]);
            }
          } else {
            setNewSecondaryImages(prev => [...prev, ...compressedList]);
          }
        }
      } catch (err) {
        console.error('New artwork image compression failed', err);
      } finally {
        setIsCompressingNew(false);
      }
    }
  };

  // Remove photo from New Product
  const handleRemoveNewImage = (index: number) => {
    if (index === 0) {
      if (newSecondaryImages.length > 0) {
        setNewImagePreview(newSecondaryImages[0]);
        setNewSecondaryImages(prev => prev.slice(1));
      } else {
        setNewImagePreview('');
      }
    } else {
      setNewSecondaryImages(prev => prev.filter((_, idx) => idx !== index - 1));
    }
  };

  // Make a photo the primary cover photo for New Product
  const handleMakeCoverNewImage = (index: number) => {
    if (index === 0) return;
    const targetImage = newSecondaryImages[index - 1];
    const oldCover = newImagePreview;
    setNewImagePreview(targetImage);
    setNewSecondaryImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== index - 1);
      return oldCover ? [oldCover, ...filtered] : filtered;
    });
  };

  // Multi-Image Upload Reader for Edit Product with automatic compression
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setIsCompressingEdit(true);
      try {
        const compressedList: string[] = [];
        for (const file of files) {
          const compressed = await processFileToCompressedDataUrl(file, 1200, 1200, 0.84);
          if (compressed) {
            compressedList.push(compressed);
          }
        }
        if (compressedList.length > 0) {
          if (!editImageUrl) {
            setEditImageUrl(compressedList[0]);
            if (compressedList.length > 1) {
              setEditSecondaryImages(prev => [...prev, ...compressedList.slice(1)]);
            }
          } else {
            setEditSecondaryImages(prev => [...prev, ...compressedList]);
          }
        }
      } catch (err) {
        console.error('Edit artwork image compression failed', err);
      } finally {
        setIsCompressingEdit(false);
      }
    }
  };

  // Remove photo from Edit Product
  const handleRemoveEditImage = (index: number) => {
    if (index === 0) {
      if (editSecondaryImages.length > 0) {
        setEditImageUrl(editSecondaryImages[0]);
        setEditSecondaryImages(prev => prev.slice(1));
      } else {
        setEditImageUrl('');
      }
    } else {
      setEditSecondaryImages(prev => prev.filter((_, idx) => idx !== index - 1));
    }
  };

  // Make a photo the primary cover photo for Edit Product
  const handleMakeCoverEditImage = (index: number) => {
    if (index === 0) return;
    const targetImage = editSecondaryImages[index - 1];
    const oldCover = editImageUrl;
    setEditImageUrl(targetImage);
    setEditSecondaryImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== index - 1);
      return oldCover ? [oldCover, ...filtered] : filtered;
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const mainPrice = parseFloat(newPrice) || 0;

    const newProd: Product = {
      id: Date.now(),
      title: newTitle,
      type: newType,
      price: mainPrice,
      image_url: newImagePreview || '/images/artwork_whispers.jpg',
      secondary_images: newSecondaryImages,
      description: newDesc || 'Minimalist artwork from the recent series.',
      weight: parseFloat(newWeight) || 1.0,
      stock_quantity: newType === 'original' ? 1 : 10,
      dimensions: newDims,
      badge: newType === 'original' ? 'AVAILABLE' : undefined,
      allow_original: newType === 'original' ? newAllowOriginal : false,
      allow_print: newAllowPrint,
      allow_digital: newAllowDigital,
      print_price: parseFloat(newPrintPrice) || (newType === 'print' ? mainPrice : 240),
      digital_price: parseFloat(newDigitalPrice) || (newType === 'digital' ? mainPrice : 15)
    };

    setIsSavingNew(true);
    try {
      if (onAddProduct) {
        await onAddProduct(newProd);
      }
      setShowAddModal(false);
      setNewTitle('');
      setNewImagePreview('');
      setNewSecondaryImages([]);
    } catch (err) {
      console.error('Error creating artwork:', err);
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditPrice(p.price.toString());
    setEditType(p.type);
    setEditWeight(p.weight.toString());
    setEditStock(p.stock_quantity.toString());
    setEditDims(p.dimensions || '');
    setEditDesc(p.description);
    setEditImageUrl(p.image_url);
    setEditSecondaryImages(p.secondary_images || []);
    setEditBadge((p.badge as any) || (p.stock_quantity === 0 ? 'SOLD' : 'AVAILABLE'));
    
    // Set format options state
    setEditAllowOriginal(p.type === 'original' && p.allow_original !== false && p.stock_quantity > 0);
    setEditAllowPrint(p.allow_print !== false);
    setEditAllowDigital(p.allow_digital !== false);
    setEditPrintPrice((p.print_price || (p.type === 'print' ? p.price : 240)).toString());
    setEditDigitalPrice((p.digital_price || (p.type === 'digital' ? p.price : 15)).toString());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !onUpdateProduct) return;

    let stockQty = parseInt(editStock, 10);
    if (isNaN(stockQty)) stockQty = 1;
    const mainPrice = parseFloat(editPrice) || 0;

    let finalBadge = editBadge;
    let allowOrig = editAllowOriginal;

    if (editBadge === 'AVAILABLE') {
      if (stockQty <= 0) stockQty = 1;
      allowOrig = editType === 'original';
    } else if (editBadge === 'SOLD') {
      stockQty = 0;
      allowOrig = false;
    } else {
      if (stockQty === 0) finalBadge = 'SOLD';
    }

    const updatedProd: Product = {
      ...editingProduct,
      title: editTitle,
      price: mainPrice,
      type: editType,
      weight: parseFloat(editWeight) || 0,
      stock_quantity: stockQty,
      dimensions: editDims,
      description: editDesc,
      image_url: editImageUrl,
      secondary_images: editSecondaryImages,
      badge: finalBadge,
      allow_original: allowOrig,
      allow_print: editAllowPrint,
      allow_digital: editAllowDigital,
      print_price: parseFloat(editPrintPrice) || (editType === 'print' ? mainPrice : 240),
      digital_price: parseFloat(editDigitalPrice) || (editType === 'digital' ? mainPrice : 15)
    };

    setIsSavingEdit(true);
    try {
      await onUpdateProduct(updatedProd);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error updating artwork:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingProduct && onDeleteProduct) {
      onDeleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const renderArtworkRow = (p: Product) => {
    const isOriginal = p.type === 'original';
    const origActive = isOriginal && p.allow_original !== false;
    const printActive = p.allow_print !== false;
    const digitalActive = p.allow_digital !== false;

    return (
      <tr key={p.id} className="hover:bg-brook/20 transition-colors">
        <td className="py-3.5 px-4 flex items-center space-x-3">
          <img src={p.image_url} alt={p.title} className="w-11 h-11 object-cover rounded-lg border-2 border-pomelo shadow-xs" />
          <div>
            <span className="font-serif font-bold text-amaranth text-sm block">{p.title}</span>
            <span className="text-[10px] text-pomelo font-bold">{p.dimensions || 'Custom'}</span>
          </div>
        </td>
        <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-pomelo">
          <span className={`px-2 py-0.5 rounded border ${p.type === 'original' ? 'bg-amaranth/10 text-amaranth border-amaranth/30' : 'bg-brook/50 text-amaranth border-pomelo/40'}`}>
            {p.type}
          </span>
        </td>
        <td className="py-3.5 px-4 font-mono font-bold text-amaranth text-sm">${p.price.toLocaleString()}</td>
        
        {/* Enabled Formats Badges */}
        <td className="py-3.5 px-4">
          <div className="flex flex-wrap gap-1">
            {origActive && (
              <span className="bg-amaranth text-chalk text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">Original</span>
            )}
            {printActive && (
              <span className="bg-brook text-amaranth text-[9px] font-bold px-2 py-0.5 rounded border border-pomelo/40">
                Print (${p.print_price || (p.type === 'print' ? p.price : 240)})
              </span>
            )}
            {digitalActive && (
              <span className="bg-thulian/30 text-amaranth text-[9px] font-bold px-2 py-0.5 rounded border border-thulian/40">
                Digital (${p.digital_price || (p.type === 'digital' ? p.price : 15)})
              </span>
            )}
            {!origActive && !printActive && !digitalActive && (
              <span className="bg-pomelo/20 text-pomelo text-[9px] font-bold px-2 py-0.5 rounded italic">None</span>
            )}
          </div>
        </td>

        <td className="py-3.5 px-4">
          <button
            type="button"
            onClick={() => {
              const isCurrentlyAvailable = p.stock_quantity > 0 && p.badge !== 'SOLD';
              const newStock = isCurrentlyAvailable ? 0 : 1;
              const updated: Product = {
                ...p,
                stock_quantity: newStock,
                badge: newStock > 0 ? 'AVAILABLE' : 'SOLD',
                allow_original: p.type === 'original' ? (newStock > 0) : p.allow_original
              };
              if (onUpdateProduct) onUpdateProduct(updated);
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border ${
              p.stock_quantity > 0 && p.badge !== 'SOLD'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            }`}
            title="Click to toggle Available / Sold Out"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${p.stock_quantity > 0 && p.badge !== 'SOLD' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{p.stock_quantity > 0 && p.badge !== 'SOLD' ? 'Available' : 'Sold Out'}</span>
          </button>
        </td>
        <td className="py-3.5 px-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            {/* Edit Button */}
            <button
              onClick={() => handleOpenEditModal(p)}
              className="px-3 py-1.5 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-lg transition-colors border border-pomelo shadow-xs font-bold flex items-center gap-1.5 text-[11px] cursor-pointer"
              title="Edit Artwork Options"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Options</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setDeletingProduct(p)}
              className="px-3 py-1.5 bg-thulian text-chalk hover:bg-amaranth rounded-lg transition-colors shadow-xs font-bold flex items-center gap-1.5 text-[11px] cursor-pointer"
              title="Delete Artwork"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-chalk py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs tracking-widest font-bold uppercase text-chalk bg-amaranth px-3 py-1 rounded shadow-xs">STUDIO MANAGEMENT</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-amaranth font-bold mt-2">Rohma Draws Studio Portal</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Studio Commissions Open/Closed Toggle Control */}
            {onToggleCommissionsOpen && (
              <button
                type="button"
                onClick={() => onToggleCommissionsOpen(!commissionsOpen)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  commissionsOpen
                    ? 'bg-brook/50 text-amaranth border-pomelo hover:bg-brook'
                    : 'bg-thulian text-chalk border-amaranth hover:bg-amaranth'
                }`}
                title="Click to toggle studio commissions status for site visitors"
              >
                {commissionsOpen ? <ToggleRight className="w-5 h-5 text-amaranth" /> : <ToggleLeft className="w-5 h-5 text-chalk" />}
                <span className="uppercase tracking-wider">
                  COMMISSIONS: {commissionsOpen ? 'OPEN FOR BOOKINGS' : 'CURRENTLY CLOSED'}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 bg-amaranth text-chalk px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-thulian transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Artwork</span>
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b-2 border-pomelo gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`py-3 px-5 rounded-t-lg transition-colors border-t border-x shrink-0 cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                : 'bg-brook/30 text-amaranth border-pomelo/30 hover:bg-thulian hover:text-chalk'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Published Inventory ({products.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('showcase')}
            className={`py-3 px-5 rounded-t-lg transition-colors border-t border-x shrink-0 cursor-pointer ${
              activeSubTab === 'showcase'
                ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                : 'bg-brook/30 text-amaranth border-pomelo/30 hover:bg-thulian hover:text-chalk'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Commissions Showcase & Status ({commissionsOpen ? 'OPEN' : 'CLOSED'})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`py-3 px-5 rounded-t-lg transition-colors border-t border-x shrink-0 cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                : 'bg-brook/30 text-amaranth border-pomelo/30 hover:bg-thulian hover:text-chalk'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Acquisitions ({orders.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('commissions')}
            className={`py-3 px-5 rounded-t-lg transition-colors border-t border-x shrink-0 cursor-pointer ${
              activeSubTab === 'commissions'
                ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                : 'bg-brook/30 text-amaranth border-pomelo/30 hover:bg-thulian hover:text-chalk'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Inquiries ({commissionRequests.length})</span>
            </div>
          </button>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-8">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-3 bg-pomelo/20 p-3 rounded-xl border border-pomelo/50 shadow-xs">
              <span className="text-xs font-bold text-amaranth uppercase tracking-wider pl-2">Filter View:</span>
              
              <button
                onClick={() => setInventoryCategory('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  inventoryCategory === 'all'
                    ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                    : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                }`}
              >
                All Artworks ({products.length})
              </button>

              <button
                onClick={() => setInventoryCategory('original')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  inventoryCategory === 'original'
                    ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                    : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                }`}
              >
                Original Paintings ({originalArtworks.length})
              </button>

              <button
                onClick={() => setInventoryCategory('print_digital')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  inventoryCategory === 'print_digital'
                    ? 'bg-amaranth text-chalk border-amaranth shadow-xs'
                    : 'bg-chalk text-[#3D262A] border-pomelo/40 hover:bg-thulian/20'
                }`}
              >
                Prints & Digital Copies ({printDigitalArtworks.length})
              </button>
            </div>

            {/* SECTION 1: ORIGINAL PAINTINGS */}
            {(inventoryCategory === 'all' || inventoryCategory === 'original') && (
              <div className="bg-chalk rounded-2xl border-2 border-pomelo shadow-xs overflow-hidden space-y-0">
                <div className="bg-pomelo/25 px-6 py-4 border-b-2 border-pomelo flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Palette className="w-5 h-5 text-amaranth" />
                    <h3 className="font-serif text-lg font-bold text-amaranth uppercase tracking-wide">
                      Original Canvas Paintings
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amaranth bg-brook px-3 py-1 rounded-full border border-pomelo/40 shadow-xs">
                    {originalArtworks.length} {originalArtworks.length === 1 ? 'Painting' : 'Paintings'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brook text-amaranth uppercase tracking-wider font-bold border-b border-pomelo/50">
                      <tr>
                        <th className="py-3 px-4">Artwork</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Original Price</th>
                        <th className="py-3 px-4">Enabled Purchasing Formats</th>
                        <th className="py-3 px-4">Stock Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pomelo/30 font-semibold text-text-primary">
                      {originalArtworks.map((p) => renderArtworkRow(p))}
                      {originalArtworks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-pomelo font-bold italic">
                            No original canvas paintings found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 2: PRINTS & DIGITAL COPIES */}
            {(inventoryCategory === 'all' || inventoryCategory === 'print_digital') && (
              <div className="bg-chalk rounded-2xl border-2 border-pomelo shadow-xs overflow-hidden space-y-0">
                <div className="bg-pomelo/25 px-6 py-4 border-b-2 border-pomelo flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-5 h-5 text-amaranth" />
                    <h3 className="font-serif text-lg font-bold text-amaranth uppercase tracking-wide">
                      Print & Digital Copies Section
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amaranth bg-brook px-3 py-1 rounded-full border border-pomelo/40 shadow-xs">
                    {printDigitalArtworks.length} {printDigitalArtworks.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brook text-amaranth uppercase tracking-wider font-bold border-b border-pomelo/50">
                      <tr>
                        <th className="py-3 px-4">Artwork</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Base Price</th>
                        <th className="py-3 px-4">Enabled Purchasing Formats</th>
                        <th className="py-3 px-4">Stock Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pomelo/30 font-semibold text-text-primary">
                      {printDigitalArtworks.map((p) => renderArtworkRow(p))}
                      {printDigitalArtworks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-pomelo font-bold italic">
                            No print or digital copy items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Commissions Card Picture & Status Manager */}
        {activeSubTab === 'showcase' && (
          <div className="bg-chalk rounded-2xl border-2 border-pomelo p-6 sm:p-8 shadow-xs space-y-8">
            
            {/* Status Control Card */}
            <div className="p-6 bg-pomelo/20 rounded-2xl border-2 border-pomelo/60 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amaranth bg-brook px-3 py-1 rounded border border-pomelo/40">
                  STUDIO COMMISSIONS STATUS
                </span>
                <h3 className="font-serif text-2xl font-bold text-amaranth mt-2">
                  Booking Availability Status
                </h3>
                <p className="text-xs text-[#3D262A] font-medium pt-1">
                  Control whether site visitors see "Commissions Open for Bookings" or "Commissions Currently Closed" across the top announcement banner, homepage card, and booking form.
                </p>
              </div>

              {onToggleCommissionsOpen && (
                <button
                  type="button"
                  onClick={() => onToggleCommissionsOpen(!commissionsOpen)}
                  className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-2 shrink-0 ${
                    commissionsOpen
                      ? 'bg-brook text-amaranth border-pomelo hover:bg-brook/80'
                      : 'bg-thulian text-chalk border-amaranth hover:bg-amaranth'
                  }`}
                >
                  {commissionsOpen ? <ToggleRight className="w-6 h-6 text-amaranth" /> : <ToggleLeft className="w-6 h-6 text-chalk" />}
                  <span className="uppercase tracking-widest text-sm">
                    {commissionsOpen ? 'STATUS: OPEN FOR BOOKINGS' : 'STATUS: CURRENTLY CLOSED'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-pomelo/40 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amaranth bg-brook px-3 py-1 rounded border border-pomelo/40">
                  HOMEPAGE COMMISSIONS CARD MANAGER
                </span>
                <h3 className="font-serif text-2xl font-bold text-amaranth mt-2">
                  Update Commissions Showcase Picture
                </h3>
                <p className="text-xs text-[#3D262A] font-medium pt-1">
                  Upload custom photos from your device, choose from published gallery artworks, or update the active image displayed inside the homepage Commissions Card.
                </p>
              </div>

              {onUpdateCommissionImage && (
                <button
                  onClick={() => onUpdateCommissionImage('/images/artwork_flowers_pink.png')}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-lg text-xs font-bold transition-all border border-pomelo shadow-xs shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Studio Default</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Live Card Frame Preview */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-pomelo block">
                  Active Homepage Card Preview:
                </span>
                <div className="relative aspect-[16/11] w-full rounded-2xl overflow-hidden border-2 border-pomelo shadow-md bg-brook/30">
                  <img
                    src={commissionCardImage}
                    alt="Active Commissions Card Showcase"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="text-[10px] font-bold tracking-widest text-chalk uppercase bg-amaranth/90 px-3 py-1.5 rounded-lg border border-pomelo/40 shadow-xs">
                      FINE ART COMMISSION • ROHMA DRAWS
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Upload & Select Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Device Image Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold text-amaranth">
                    Option A: Upload New Picture (From Computer / Phone)
                  </label>
                  <div className="relative border-2 border-dashed border-amaranth bg-brook/20 p-6 text-center rounded-2xl hover:bg-chalk transition-all cursor-pointer group shadow-xs">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleShowcaseImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {isCompressingShowcase ? (
                      <div className="py-4 text-amaranth font-bold flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 rounded-full border-2 border-amaranth border-t-transparent animate-spin" />
                        <span>Optimizing Device Image...</span>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <Upload className="w-8 h-8 mx-auto text-amaranth group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-amaranth">Click or Drag & Drop Photo File</p>
                        <p className="text-[10px] text-pomelo font-bold">Supports high-res JPG, PNG, WEBP (Auto-optimized)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Select from Published Artworks Gallery */}
                <div className="space-y-2 pt-2 border-t border-pomelo/30">
                  <label className="block text-xs uppercase font-bold text-amaranth">
                    Option B: Select from Published Gallery Artworks
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {products.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onUpdateCommissionImage && onUpdateCommissionImage(p.image_url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                          commissionCardImage === p.image_url ? 'border-amaranth ring-2 ring-amaranth shadow-md' : 'border-pomelo/50 hover:border-amaranth opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        {commissionCardImage === p.image_url && (
                          <div className="absolute inset-0 bg-amaranth/30 flex items-center justify-center">
                            <span className="bg-amaranth text-chalk rounded-full p-1 shadow-xs">
                              <Check className="w-4 h-4" />
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-chalk bg-text-primary/70 px-1 py-0.5 rounded truncate block text-center">
                          {p.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Orders Tracking (LIVE MYSQL ORDERS) */}
        {activeSubTab === 'orders' && (
          <div className="bg-chalk rounded-2xl border-2 border-pomelo p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-pomelo/40 pb-4 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amaranth bg-brook px-3 py-1 rounded border border-pomelo/40">
                  LIVE MYSQL ACQUISITIONS DATABASE
                </span>
                <h3 className="font-serif text-2xl font-bold text-amaranth mt-2">
                  Collector Orders & Purchases ({orders.length})
                </h3>
                <p className="text-xs text-[#3D262A] font-medium pt-1">
                  Real-time acquisition records stored in your MySQL database (`rohmnkmq_rohmaadraws`), with full buyer addresses, purchased artwork manifest, and payment details.
                </p>
              </div>

              {onRefreshOrders && (
                <button
                  onClick={onRefreshOrders}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-xl text-xs font-bold transition-all border border-pomelo shadow-xs shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Orders</span>
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-brook/10 rounded-2xl border border-pomelo/30">
                <ShoppingBag className="w-10 h-10 mx-auto text-pomelo" />
                <h4 className="font-serif text-lg font-bold text-amaranth">No Orders Recorded Yet</h4>
                <p className="text-xs text-pomelo font-medium max-w-sm mx-auto">
                  When collectors complete acquisitions on your website, their full shipping address, purchased artworks, and payment receipts will appear right here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord: any) => {
                  const itemsList = Array.isArray(ord.items) ? ord.items : [];
                  return (
                    <div key={ord.id} className="bg-brook/20 p-6 rounded-2xl border-2 border-pomelo/60 shadow-xs space-y-4">
                      
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-pomelo/40 pb-3 gap-2">
                        <div>
                          <span className="font-mono font-bold text-amaranth text-base block">
                            ORDER #{ord.order_number || `RD-${ord.id}`}
                          </span>
                          <span className="text-xs text-[#3D262A] font-bold block pt-0.5">
                            Collector: <strong className="text-amaranth">{ord.customer_name}</strong> ({ord.shipping_country || 'SG'})
                          </span>
                          <a
                            href={`mailto:${ord.customer_email}`}
                            className="text-xs text-amaranth font-bold hover:underline flex items-center gap-1 pt-0.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{ord.customer_email}</span>
                          </a>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Payment & Status Badges */}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
                            ord.status === 'shipped'
                              ? 'bg-brook text-amaranth border-pomelo'
                              : ord.status === 'paid'
                              ? 'bg-amaranth text-chalk border-amaranth'
                              : ord.status === 'cancelled'
                              ? 'bg-pomelo/30 text-text-primary border-pomelo'
                              : 'bg-thulian text-chalk border-thulian'
                          }`}>
                            {ord.status || 'Paid'}
                          </span>

                          <span className="font-mono font-bold text-lg text-amaranth bg-chalk px-3 py-1 rounded-lg border border-pomelo/50 shadow-xs">
                            ${ord.total_amount ? Number(ord.total_amount).toLocaleString() : '0.00'} USD
                          </span>
                        </div>
                      </div>

                      {/* Delivery Address & Collector Information */}
                      <div className="bg-chalk/80 p-4 rounded-xl border border-pomelo/40 text-xs space-y-1.5">
                        <div className="flex items-center space-x-1.5 font-bold text-amaranth uppercase tracking-wider text-[10px]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Delivery Destination & Collector Address</span>
                        </div>
                        <p className="font-bold text-[#3D262A] text-xs">
                          {ord.shipping_address || 'Standard Delivery'}
                        </p>
                        <p className="text-[11px] text-pomelo font-semibold">
                          Payment: {ord.payment_method || 'Stripe'}
                          {ord.created_at && ` • Date: ${new Date(ord.created_at).toLocaleString()}`}
                        </p>
                      </div>

                      {/* Purchased Artworks Manifest */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pomelo">Purchased Artworks ({itemsList.length}):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {itemsList.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="flex items-center space-x-3 bg-chalk p-3 rounded-xl border border-pomelo/40">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded-lg border border-pomelo/40 shrink-0"
                                />
                              )}
                              <div className="text-xs min-w-0 flex-1">
                                <span className="font-serif font-bold text-amaranth block truncate">{item.title}</span>
                                <span className="text-[10px] text-pomelo font-bold uppercase block">
                                  {item.type || 'Artwork'} • Qty: {item.quantity || 1}
                                </span>
                                <span className="font-mono font-bold text-[#3D262A] text-xs">
                                  ${item.price ? Number(item.price).toLocaleString() : '0'} USD
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Management Actions */}
                      <div className="pt-3 border-t border-pomelo/40 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-pomelo mr-1">Update Status:</span>
                          
                          <button
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(ord.id, 'paid')}
                            className="px-3 py-1 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-lg text-xs font-bold transition-all border border-pomelo shadow-xs cursor-pointer"
                          >
                            Mark Paid
                          </button>

                          <button
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(ord.id, 'shipped')}
                            className="px-3 py-1 bg-amaranth text-chalk hover:bg-thulian rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Mark Shipped
                          </button>

                          <button
                            onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(ord.id, 'cancelled')}
                            className="px-3 py-1 bg-pomelo/30 text-text-primary hover:bg-thulian hover:text-chalk rounded-lg text-xs font-bold transition-all border border-pomelo shadow-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {onDeleteOrder && (
                          <button
                            onClick={() => onDeleteOrder(ord.id)}
                            className="px-3 py-1 bg-thulian text-chalk hover:bg-amaranth rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Order</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Live Commission Inquiries (Synced Real-Time with MySQL Database) */}
        {activeSubTab === 'commissions' && (
          <div className="bg-chalk rounded-2xl border-2 border-pomelo p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-pomelo/40 pb-4 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amaranth bg-brook px-3 py-1 rounded border border-pomelo/40">
                  LIVE MYSQL DATABASE INQUIRIES
                </span>
                <h3 className="font-serif text-2xl font-bold text-amaranth mt-2">
                  Client Commission Inquiries ({commissionRequests.length})
                </h3>
                <p className="text-xs text-[#3D262A] font-medium pt-1">
                  Every custom commission request submitted by collectors on rohmaadraws.com is saved directly to your live MySQL database (`rohmnkmq_rohmaadraws`).
                </p>
              </div>

              {onRefreshCommissions && (
                <button
                  onClick={onRefreshCommissions}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-xl text-xs font-bold transition-all border border-pomelo shadow-xs shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Real-Time Inquiries</span>
                </button>
              )}
            </div>

            {commissionRequests.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-brook/10 rounded-2xl border border-pomelo/30">
                <MessageSquare className="w-10 h-10 mx-auto text-pomelo" />
                <h4 className="font-serif text-lg font-bold text-amaranth">No Commission Inquiries Yet</h4>
                <p className="text-xs text-pomelo font-medium max-w-sm mx-auto">
                  When collectors submit a custom piece inquiry or waitlist request on your site, it will instantly appear right here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {commissionRequests.map((req) => (
                  <div key={req.id} className="bg-thulian/20 p-6 rounded-2xl border-2 border-pomelo/60 shadow-xs space-y-4">
                    
                    {/* Header: Name, Status, Date */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-pomelo/40 pb-3 gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-amaranth text-chalk flex items-center justify-center font-bold font-serif text-sm shadow-xs shrink-0">
                          {req.name ? req.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 className="font-serif text-lg font-bold text-amaranth flex items-center gap-2">
                            <span>{req.name}</span>
                          </h4>
                          <a
                            href={`mailto:${req.email}`}
                            className="text-xs text-amaranth font-bold hover:underline flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{req.email}</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
                          req.status === 'accepted'
                            ? 'bg-brook text-amaranth border-pomelo'
                            : req.status === 'reviewed'
                            ? 'bg-thulian text-chalk border-amaranth'
                            : req.status === 'declined'
                            ? 'bg-pomelo/30 text-text-primary border-pomelo'
                            : 'bg-amaranth text-chalk border-amaranth'
                        }`}>
                          {req.status || 'Pending'}
                        </span>

                        {req.created_at && (
                          <span className="text-[10px] font-bold text-pomelo flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-chalk/80 p-4 rounded-xl border border-pomelo/40 text-xs">
                      <div>
                        <span className="text-pomelo font-bold block uppercase text-[10px] tracking-wider">Canvas Size Specs</span>
                        <span className="font-serif font-bold text-amaranth text-sm block pt-0.5">{req.size || 'Custom Size'}</span>
                      </div>
                      <div>
                        <span className="text-pomelo font-bold block uppercase text-[10px] tracking-wider">Collector Budget</span>
                        <span className="font-mono font-bold text-amaranth text-sm block pt-0.5">${req.budget} USD</span>
                      </div>
                    </div>

                    {/* Description Text */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pomelo">Project Vision & Description:</span>
                      <p className="text-xs text-[#3D262A] font-medium leading-relaxed bg-chalk/60 p-4 rounded-xl border border-pomelo/30 italic">
                        "{req.description}"
                      </p>
                    </div>

                    {/* Reference Link & Reference Image Thumbnails */}
                    {(req.reference_url || req.reference_image_url) && (
                      <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-pomelo/30">
                        {req.reference_url && (
                          <a
                            href={req.reference_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-amaranth bg-brook/50 px-3 py-1.5 rounded-lg border border-pomelo/40 hover:bg-amaranth hover:text-chalk transition-all shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Moodboard Link</span>
                          </a>
                        )}

                        {req.reference_image_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageModalUrl(req.reference_image_url)}
                            className="inline-flex items-center space-x-2 text-xs font-bold text-amaranth bg-brook/50 px-3 py-1.5 rounded-lg border border-pomelo/40 hover:bg-amaranth hover:text-chalk transition-all shadow-xs cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>View Reference Image</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Controls */}
                    <div className="pt-3 border-t border-pomelo/40 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-pomelo mr-1">Update Status:</span>
                        
                        <button
                          onClick={() => onUpdateCommissionStatus && onUpdateCommissionStatus(req.id, 'reviewed')}
                          className="px-3 py-1 bg-brook text-amaranth hover:bg-amaranth hover:text-chalk rounded-lg text-xs font-bold transition-all border border-pomelo shadow-xs cursor-pointer"
                        >
                          Under Review
                        </button>

                        <button
                          onClick={() => onUpdateCommissionStatus && onUpdateCommissionStatus(req.id, 'accepted')}
                          className="px-3 py-1 bg-amaranth text-chalk hover:bg-thulian rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Accept Inquiry
                        </button>

                        <button
                          onClick={() => onUpdateCommissionStatus && onUpdateCommissionStatus(req.id, 'declined')}
                          className="px-3 py-1 bg-pomelo/30 text-text-primary hover:bg-thulian hover:text-chalk rounded-lg text-xs font-bold transition-all border border-pomelo shadow-xs cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>

                      {onDeleteCommissionRequest && (
                        <button
                          onClick={() => onDeleteCommissionRequest(req.id)}
                          className="px-3 py-1 bg-thulian text-chalk hover:bg-amaranth rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REFERENCE IMAGE PREVIEW MODAL */}
      {previewImageModalUrl && (
        <div className="fixed inset-0 z-50 bg-text-primary/60 flex items-center justify-center p-4">
          <div className="bg-chalk p-6 rounded-2xl border-2 border-pomelo max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-pomelo/40 pb-3">
              <h3 className="font-serif text-xl font-bold text-amaranth">Collector Reference Image</h3>
              <button onClick={() => setPreviewImageModalUrl(null)} className="p-1 text-pomelo hover:text-amaranth cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl border border-pomelo">
              <img src={previewImageModalUrl} alt="Reference Attachment" className="w-full h-full object-contain max-h-[65vh]" />
            </div>
          </div>
        </div>
      )}

      {/* EDIT ARTWORK MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-text-primary/40 flex items-center justify-center p-4">
          <div className="bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-pomelo/40 pb-3">
              <h3 className="font-serif text-2xl font-bold text-amaranth">Edit Artwork & Purchasing Options</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-pomelo hover:text-amaranth cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              
              {/* MULTI-PICTURE ARTWORK GALLERY UPLOADER (EDIT) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-pomelo font-bold">
                    Artwork Photos & Detail Views ({([editImageUrl, ...editSecondaryImages].filter(Boolean)).length})
                  </label>
                  <span className="text-[10px] text-amaranth font-bold bg-brook/60 px-2 py-0.5 rounded">
                    Mobile Multi-Photo Enabled
                  </span>
                </div>

                {/* Visual Thumbnail Grid */}
                {([editImageUrl, ...editSecondaryImages].filter(Boolean)).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-brook/20 rounded-xl border border-pomelo/50">
                    {([editImageUrl, ...editSecondaryImages].filter(Boolean)).map((img, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square bg-chalk ${
                            isCover ? 'border-amaranth ring-2 ring-amaranth/30' : 'border-pomelo/60'
                          }`}
                        >
                          <img src={img} alt={`Artwork View ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Hover / Touch Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <div className="flex justify-between items-start w-full">
                              {isCover ? (
                                <span className="bg-amaranth text-chalk text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                  ⭐ Cover
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMakeCoverEditImage(idx)}
                                  className="bg-chalk/90 hover:bg-chalk text-amaranth text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs cursor-pointer"
                                  title="Make this photo the primary cover"
                                >
                                  Make Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveEditImage(idx)}
                                className="w-5 h-5 bg-rose-600 hover:bg-rose-700 text-chalk rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                                title="Remove photo"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Default Cover Badge */}
                          {isCover && (
                            <span className="absolute bottom-1 left-1 bg-amaranth text-chalk text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs group-hover:opacity-0 transition-opacity">
                              ⭐ Main Cover
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload More Photos Dropzone */}
                <div className="relative border-2 border-dashed border-pomelo bg-brook/20 p-3.5 text-center rounded-xl hover:border-amaranth transition-colors cursor-pointer group shadow-inner">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {isCompressingEdit ? (
                    <div className="py-2 text-amaranth font-bold flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amaranth border-t-transparent animate-spin" />
                      <span>Optimizing Photos from Device...</span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Upload className="w-5 h-5 mx-auto text-amaranth group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-amaranth">
                        {([editImageUrl, ...editSecondaryImages].filter(Boolean)).length > 0
                          ? '+ Tap to Add More Photos / Detail Angles'
                          : 'Tap to Upload Photos (Select 1 or Multiple from Phone/Laptop)'}
                      </p>
                      <p className="text-[10px] text-pomelo font-bold">
                        JPG, PNG, WEBP (Select multiple pictures at once from your phone)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-pomelo mb-1">Artwork Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary font-serif font-bold text-sm focus:outline-none focus:border-amaranth"
                />
              </div>

              {/* UNIVERSAL FORMAT OPTIONS CONTROL PANEL */}
              <div className="p-4 bg-pomelo/20 rounded-xl border-2 border-pomelo/60 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-pomelo/40 pb-2">
                  <span className="text-xs font-bold text-amaranth uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amaranth" />
                    <span>Enabled Format Editions & Pricing</span>
                  </span>
                  <span className="text-[10px] text-amaranth font-bold bg-brook/60 px-2 py-0.5 rounded">
                    Artist Dashboard Control
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Original Canvas */}
                  {editType === 'original' && (
                    <div className="flex items-center justify-between bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowOriginal}
                          onChange={(e) => setEditAllowOriginal(e.target.checked)}
                          className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                        />
                        <span className="text-xs text-[#3D262A] font-bold">1. Original Painting (1 of 1)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-amaranth">${editPrice} USD</span>
                    </div>
                  )}

                  {/* Option 2: Fine Art Print */}
                  <div className="space-y-1.5 bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowPrint}
                          onChange={(e) => setEditAllowPrint(e.target.checked)}
                          className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                        />
                        <span className="text-xs text-[#3D262A] font-bold">2. Archival Fine Art Print</span>
                      </label>
                    </div>
                    {editAllowPrint && (
                      <div className="flex items-center space-x-2 pl-7 pt-1">
                        <span className="text-[11px] text-pomelo font-bold">Print Price ($USD):</span>
                        <input
                          type="number"
                          value={editPrintPrice}
                          onChange={(e) => setEditPrintPrice(e.target.value)}
                          className="w-24 bg-chalk border-b border-pomelo px-2 py-0.5 text-xs font-mono font-bold text-amaranth focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Option 3: Instant Digital Copy */}
                  <div className="space-y-1.5 bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowDigital}
                          onChange={(e) => setEditAllowDigital(e.target.checked)}
                          className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                        />
                        <span className="text-xs text-[#3D262A] font-bold">3. Instant Digital Download</span>
                      </label>
                    </div>
                    {editAllowDigital && (
                      <div className="flex items-center space-x-2 pl-7 pt-1">
                        <span className="text-[11px] text-pomelo font-bold">Digital Price ($USD):</span>
                        <input
                          type="number"
                          value={editDigitalPrice}
                          onChange={(e) => setEditDigitalPrice(e.target.value)}
                          className="w-24 bg-chalk border-b border-pomelo px-2 py-0.5 text-xs font-mono font-bold text-amaranth focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-pomelo mb-1">Primary Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  >
                    <option value="original">Original</option>
                    <option value="print">Print</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-pomelo mb-1">Base Price ($USD)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-pomelo mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-pomelo mb-1">Freight Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-pomelo mb-1 font-bold">Status Badge</label>
                <select
                  value={editBadge}
                  onChange={(e) => setEditBadge(e.target.value as any)}
                  className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="SOLD">SOLD OUT</option>
                  <option value="LIMITED EDITION">LIMITED EDITION</option>
                  <option value="INSTANT DOWNLOAD">INSTANT DOWNLOAD</option>
                </select>
              </div>

              <div>
                <label className="block text-pomelo mb-1">Dimensions</label>
                <input
                  type="text"
                  value={editDims}
                  onChange={(e) => setEditDims(e.target.value)}
                  className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-pomelo mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-chalk border border-pomelo p-2 text-text-primary focus:outline-none rounded-lg"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 py-3 bg-pomelo/30 text-text-primary rounded-xl uppercase tracking-wider font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressingEdit || isSavingEdit}
                  className="w-1/2 py-3 bg-amaranth text-chalk rounded-xl uppercase tracking-wider font-bold hover:bg-thulian transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-chalk border-t-transparent animate-spin" />
                      <span>Saving Artwork...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-text-primary/50 flex items-center justify-center p-4">
          <div className="bg-chalk p-6 rounded-2xl border-2 border-pomelo max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-thulian text-chalk rounded-full flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-amaranth">Delete Published Artwork?</h3>
            <p className="text-xs text-text-primary font-medium">
              Are you sure you want to remove <span className="font-bold text-amaranth font-serif">{deletingProduct.title}</span> from Rohma Draws Studio archive? This action cannot be undone.
            </p>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="w-1/2 py-3 bg-pomelo/30 text-text-primary rounded-xl uppercase tracking-wider font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-3 bg-thulian text-chalk rounded-xl uppercase tracking-wider font-bold hover:bg-amaranth transition-colors shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH NEW ARTWORK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-text-primary/40 flex items-center justify-center p-4">
          <div className="bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-pomelo/40 pb-3">
              <h3 className="font-serif text-2xl font-bold text-amaranth">Publish New Artwork</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-pomelo hover:text-amaranth cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-bold">
              
              {/* MULTI-PICTURE ARTWORK GALLERY UPLOADER (NEW) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-pomelo font-bold">
                    Upload Artwork Photos & Detail Views ({([newImagePreview, ...newSecondaryImages].filter(Boolean)).length})
                  </label>
                  <span className="text-[10px] text-amaranth font-bold bg-brook/60 px-2 py-0.5 rounded">
                    Mobile Multi-Photo Enabled
                  </span>
                </div>

                {/* Visual Thumbnail Grid */}
                {([newImagePreview, ...newSecondaryImages].filter(Boolean)).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-brook/20 rounded-xl border border-pomelo/50">
                    {([newImagePreview, ...newSecondaryImages].filter(Boolean)).map((img, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square bg-chalk ${
                            isCover ? 'border-amaranth ring-2 ring-amaranth/30' : 'border-pomelo/60'
                          }`}
                        >
                          <img src={img} alt={`Artwork View ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Hover / Touch Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <div className="flex justify-between items-start w-full">
                              {isCover ? (
                                <span className="bg-amaranth text-chalk text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                  ⭐ Cover
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMakeCoverNewImage(idx)}
                                  className="bg-chalk/90 hover:bg-chalk text-amaranth text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs cursor-pointer"
                                  title="Make this photo the primary cover"
                                >
                                  Make Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(idx)}
                                className="w-5 h-5 bg-rose-600 hover:bg-rose-700 text-chalk rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                                title="Remove photo"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Default Cover Badge */}
                          {isCover && (
                            <span className="absolute bottom-1 left-1 bg-amaranth text-chalk text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs group-hover:opacity-0 transition-opacity">
                              ⭐ Main Cover
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload More Photos Dropzone */}
                <div className="relative border-2 border-dashed border-pomelo bg-brook/20 p-4 text-center rounded-xl hover:border-amaranth transition-colors cursor-pointer group shadow-inner">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    required={!newImagePreview}
                    onChange={handleNewImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {isCompressingNew ? (
                    <div className="py-3 text-amaranth font-bold flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amaranth border-t-transparent animate-spin" />
                      <span>Optimizing Photos from Device...</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <Upload className="w-6 h-6 mx-auto text-amaranth group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-amaranth">
                        {newImagePreview ? '+ Tap to Add More Detail Photos / Views' : 'Tap to Upload Photos (Select 1 or Multiple from Phone/Laptop)'}
                      </p>
                      <p className="text-[10px] text-pomelo font-bold">
                        Select front view, canvas texture, close-ups, or room mockups (JPG, PNG, WEBP)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-pomelo mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary font-serif font-bold text-sm focus:outline-none focus:border-amaranth"
                  placeholder="e.g. Composition No. 9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-pomelo mb-1">Primary Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  >
                    <option value="original">Original</option>
                    <option value="print">Print</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-pomelo mb-1">Base Price ($USD)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* UNIVERSAL FORMAT OPTIONS CONTROL PANEL */}
              <div className="p-4 bg-pomelo/20 rounded-xl border-2 border-pomelo/60 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-pomelo/40 pb-2">
                  <span className="text-xs font-bold text-amaranth uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amaranth" />
                    <span>Enabled Purchasing Formats & Pricing</span>
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Original Canvas */}
                  {newType === 'original' && (
                    <div className="flex items-center justify-between bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAllowOriginal}
                          onChange={(e) => setNewAllowOriginal(e.target.checked)}
                          className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                        />
                        <span className="text-xs text-[#3D262A] font-bold">1. Original Painting (1 of 1)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-amaranth">${newPrice} USD</span>
                    </div>
                  )}

                  {/* Option 2: Fine Art Print */}
                  <div className="space-y-1.5 bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAllowPrint}
                        onChange={(e) => setNewAllowPrint(e.target.checked)}
                        className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                      />
                      <span className="text-xs text-[#3D262A] font-bold">2. Archival Fine Art Print</span>
                    </label>
                    {newAllowPrint && (
                      <div className="flex items-center space-x-2 pl-7 pt-1">
                        <span className="text-[11px] text-pomelo font-bold">Print Price ($USD):</span>
                        <input
                          type="number"
                          value={newPrintPrice}
                          onChange={(e) => setNewPrintPrice(e.target.value)}
                          className="w-24 bg-chalk border-b border-pomelo px-2 py-0.5 text-xs font-mono font-bold text-amaranth focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Option 3: Instant Digital Copy */}
                  <div className="space-y-1.5 bg-chalk p-2.5 rounded-lg border border-pomelo/40">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAllowDigital}
                        onChange={(e) => setNewAllowDigital(e.target.checked)}
                        className="w-4 h-4 text-amaranth rounded border-pomelo focus:ring-amaranth accent-amaranth"
                      />
                      <span className="text-xs text-[#3D262A] font-bold">3. Instant Digital Download</span>
                    </label>
                    {newAllowDigital && (
                      <div className="flex items-center space-x-2 pl-7 pt-1">
                        <span className="text-[11px] text-pomelo font-bold">Digital Price ($USD):</span>
                        <input
                          type="number"
                          value={newDigitalPrice}
                          onChange={(e) => setNewDigitalPrice(e.target.value)}
                          className="w-24 bg-chalk border-b border-pomelo px-2 py-0.5 text-xs font-mono font-bold text-amaranth focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-pomelo mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-pomelo mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={newDims}
                    onChange={(e) => setNewDims(e.target.value)}
                    className="w-full bg-chalk border-b-2 border-pomelo py-1.5 px-2 text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-pomelo mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-chalk border border-pomelo p-2 text-text-primary focus:outline-none rounded-lg"
                  placeholder="Describe the artwork technique, materials, and inspiration..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 bg-pomelo/30 text-text-primary rounded-xl uppercase tracking-wider font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressingNew || isSavingNew}
                  className="w-1/2 py-3 bg-amaranth text-chalk rounded-xl uppercase tracking-wider font-bold hover:bg-thulian transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isSavingNew ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-chalk border-t-transparent animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Artwork</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
