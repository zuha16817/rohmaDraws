import React, { useState } from 'react';
import { Upload, CheckCircle, Info, MessageSquare, Palette, Truck, Link as LinkIcon, Lock, Sparkles, Loader2 } from 'lucide-react';
import { submitCommissionRequest } from '../services/api';
import { compressImageFile } from '../utils/imageCompressor';

interface CommissionsProps {
  commissionsOpen?: boolean;
  onCommissionSubmitted?: () => void;
}

export const Commissions: React.FC<CommissionsProps> = ({ commissionsOpen = true, onCommissionSubmitted }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    size: '120cm x 90cm',
    budget: '150',
    reference_url: '',
    description: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      setFilePreview(URL.createObjectURL(rawFile));
      setIsCompressing(true);
      try {
        // Compress large camera photos (e.g. 15MB) into lightweight ~150KB JPEG in milliseconds
        const optimizedFile = await compressImageFile(rawFile, 1400, 1400, 0.82);
        setFile(optimizedFile);
      } catch (err) {
        setFile(rawFile);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let fileToSend = file;
    if (file && isCompressing) {
      // Wait briefly if compression is still concluding
      fileToSend = await compressImageFile(file, 1400, 1400, 0.82);
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('size', formData.size);
    submitData.append('budget', formData.budget);
    submitData.append('description', formData.description);
    if (formData.reference_url) {
      submitData.append('reference_url', formData.reference_url);
    }
    if (fileToSend) {
      submitData.append('reference_image', fileToSend);
    }

    const res = await submitCommissionRequest(submitData);
    setIsSubmitting(false);

    if (res.status === 'success') {
      setIsSuccess(true);
      onCommissionSubmitted?.();
    }
  };

  return (
    <div className="bg-chalk py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title Header Card with Dynamic Studio Status Badge */}
        <div className="bg-pomelo/20 p-6 sm:p-8 rounded-2xl border-2 border-pomelo/60 shadow-xs max-w-4xl space-y-3 relative">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 ${
              commissionsOpen
                ? 'bg-brook text-amaranth border-pomelo/40'
                : 'bg-thulian text-chalk border-amaranth'
            }`}>
              {commissionsOpen ? <Info className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{commissionsOpen ? 'COMMISSIONS OPEN FOR BOOKINGS' : 'COMMISSIONS CURRENTLY CLOSED'}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-amaranth leading-[1.1] pt-1">
            {commissionsOpen ? 'Commission a Piece' : 'Join Priority Waitlist'}
          </h1>
          <p className="text-xs sm:text-sm text-[#3D262A] leading-relaxed font-medium pt-1">
            {commissionsOpen
              ? "Every commission is a collaborative dialogue. Please share your vision, spatial requirements, and any specific themes you wish to explore. Due to the intricate nature of the work, only a limited number of commissions are accepted each season."
              : "Studio commission bookings are currently closed for the season. You may submit your inquiry below to join the priority waitlist and be notified first when new seasonal commission slots open."
            }
          </p>
        </div>

        {/* Two-Column Form & Process Layout (Harmonized Heights) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Form Card in Thulian Pink 30% Opacity */}
          <div className="lg:col-span-7 bg-thulian/30 p-6 sm:p-8 lg:p-10 rounded-2xl border-2 border-thulian/60 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            {isSuccess ? (
              <div className="py-16 text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-amaranth text-chalk rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-3xl font-bold text-amaranth">
                  {commissionsOpen ? 'Commission Request Received' : 'Priority Waitlist Inquiry Received'}
                </h3>
                <p className="text-xs text-[#3D262A] font-semibold max-w-md mx-auto">
                  Thank you, {formData.name}. Rohma will review your details and contact you at {formData.email} within 48 hours.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-6 py-3 bg-amaranth text-chalk text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-thulian transition-colors shadow-xs cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7 flex-1 flex flex-col justify-between">
                
                <div className="space-y-7">
                  {/* Notice if Closed */}
                  {!commissionsOpen && (
                    <div className="p-4 bg-thulian/40 text-amaranth rounded-xl border border-thulian flex items-center space-x-2 text-xs font-bold shadow-xs">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Studio is currently closed for active bookings. Submissions join the upcoming season priority waitlist.</span>
                    </div>
                  )}

                  {/* 01 Collector Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs tracking-widest uppercase font-bold text-amaranth bg-brook/80 inline-block px-3 py-1 rounded border border-pomelo/50 shadow-xs">
                      <span className="text-amaranth font-mono text-sm">01</span> Collector Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="full-name-comm-3" className="block text-[11px] uppercase font-bold text-amaranth mb-1">Full Name</label>
                        <input
                          id="full-name-comm-3"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-chalk/90 border-b-2 border-amaranth py-2.5 px-3 text-xs text-[#3D262A] font-bold focus:outline-none focus:bg-chalk shadow-xs rounded-t"
                          placeholder="e.g. Eleanor Vance"
                        />
                      </div>
                      <div>
                        <label htmlFor="email-comm-3" className="block text-[11px] uppercase font-bold text-amaranth mb-1">Email Address</label>
                        <input
                          id="email-comm-3"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-chalk/90 border-b-2 border-amaranth py-2.5 px-3 text-xs text-[#3D262A] font-bold focus:outline-none focus:bg-chalk shadow-xs rounded-t"
                          placeholder="e.g. eleanor@gallery.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 02 Project Specifications */}
                  <div className="space-y-6 pt-5 border-t border-amaranth/20">
                    <h3 className="text-xs tracking-widest uppercase font-bold text-amaranth bg-brook/80 inline-block px-3 py-1 rounded border border-pomelo/50 shadow-xs">
                      <span className="text-amaranth font-mono text-sm">02</span> Project Specifications
                    </h3>
                    
                    {/* Dimensions Dropdown */}
                    <div>
                      <label htmlFor="size-comm-3" className="block text-[11px] uppercase font-bold text-amaranth mb-1">Dimensions</label>
                      <select
                        id="size-comm-3"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="w-full bg-chalk/90 border-b-2 border-amaranth py-3 px-3 text-xs text-[#3D262A] font-bold focus:outline-none focus:bg-chalk cursor-pointer shadow-xs rounded-t"
                      >
                        <option value="90cm x 60cm">Medium (90cm x 60cm)</option>
                        <option value="120cm x 90cm">Large (120cm x 90cm)</option>
                        <option value="150cm x 100cm">Statement (150cm x 100cm)</option>
                        <option value="Diptych / Custom">Diptych / Multi-panel Custom</option>
                      </select>
                    </div>

                    {/* Range Slider for Investment Budget */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="budget-comm-slider" className="block text-[11px] uppercase font-bold text-amaranth">
                          Investment Budget ($USD)
                        </label>
                        <span className="font-jakarta text-xs font-bold text-chalk bg-amaranth px-3 py-1 rounded-full shadow-xs">
                          ${Number(formData.budget).toLocaleString()} USD
                        </span>
                      </div>
                      <input
                        id="budget-comm-slider"
                        type="range"
                        min="0"
                        max="300"
                        step="10"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full h-2.5 bg-chalk/90 rounded-lg appearance-none cursor-pointer accent-amaranth border border-pomelo/40 mt-1"
                      />
                      <div className="flex justify-between text-[11px] text-amaranth font-bold pt-1.5 font-jakarta tracking-wide">
                        <span>$0 USD</span>
                        <span>$150 USD</span>
                        <span>$300 USD</span>
                      </div>
                    </div>
                  </div>

                  {/* 03 Vision & Concept */}
                  <div className="space-y-5 pt-5 border-t border-amaranth/20">
                    <h3 className="text-xs tracking-widest uppercase font-bold text-amaranth bg-brook/80 inline-block px-3 py-1 rounded border border-pomelo/50 shadow-xs">
                      <span className="text-amaranth font-mono text-sm">03</span> Vision & Concept
                    </h3>

                    <div>
                      <label htmlFor="desc-comm-3" className="block text-[11px] uppercase font-bold text-amaranth mb-1">Description</label>
                      <textarea
                        id="desc-comm-3"
                        rows={3}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the space where the artwork will live, colors you gravitate towards, and the emotional resonance you are seeking..."
                        className="w-full bg-chalk/90 border-2 border-pomelo p-3 text-xs text-[#3D262A] font-semibold focus:outline-none focus:border-amaranth focus:bg-chalk rounded-lg shadow-xs"
                      />
                    </div>

                    {/* Reference URL Link Input */}
                    <div>
                      <label htmlFor="reference-url" className="flex items-center space-x-1.5 text-[11px] uppercase font-bold text-amaranth mb-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Reference Links / Moodboard URL (Optional)</span>
                      </label>
                      <input
                        id="reference-url"
                        type="url"
                        value={formData.reference_url}
                        onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                        className="w-full bg-chalk/90 border-b-2 border-amaranth py-2.5 px-3 text-xs text-[#3D262A] font-bold focus:outline-none focus:bg-chalk shadow-xs rounded-t"
                        placeholder="e.g. https://pinterest.com/board/my-moodboard or https://drive.google.com/..."
                      />
                    </div>

                    {/* File Upload Dropzone */}
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-amaranth mb-1">Reference Imagery (Optional)</label>
                      <div className="relative border-2 border-dashed border-amaranth bg-chalk/60 p-5 text-center rounded-xl hover:border-thulian hover:bg-chalk transition-all cursor-pointer group shadow-xs">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {filePreview ? (
                          <div className="flex items-center justify-center space-x-3">
                            <img src={filePreview} alt="Upload Preview" className="w-10 h-10 object-cover rounded border border-amaranth" />
                            <span className="text-xs text-amaranth font-bold">{file?.name}</span>
                          </div>
                        ) : (
                          <div className="space-y-1 py-1">
                            <Upload className="w-5 h-5 mx-auto text-amaranth group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-bold text-amaranth">Upload Reference Imagery</p>
                            <p className="text-[10px] text-[#3D262A]/80 font-bold">Drag and drop spatial photos or inspiration (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || isCompressing}
                    className="w-full py-4 bg-amaranth text-chalk text-xs font-bold uppercase tracking-widest hover:bg-thulian transition-all shadow-md rounded-xl hover:scale-[1.01] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || isCompressing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isCompressing ? 'Optimizing Image...' : 'Sending Request...'}</span>
                      </>
                    ) : commissionsOpen ? (
                      <span>SUBMIT COMMISSION REQUEST</span>
                    ) : (
                      <span>JOIN PRIORITY WAITLIST</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: 'The Process' Card Moved to the Top & Harmonized in Height */}
          <div className="lg:col-span-5 bg-chalk p-6 sm:p-8 rounded-2xl border-2 border-pomelo shadow-xs flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-pomelo/40 pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-chalk bg-amaranth px-2.5 py-0.5 rounded shadow-xs">
                    STUDIO WORKFLOW
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-amaranth pt-1">The Process</h3>
                </div>
                <Sparkles className="w-6 h-6 text-amaranth shrink-0" />
              </div>

              {/* 3 Detailed Steps */}
              <div className="space-y-5">
                
                {/* Step 1 */}
                <div className="bg-brook/20 p-4 rounded-xl border border-pomelo/40 space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amaranth text-chalk flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-amaranth uppercase tracking-wider">01. Spatial Consultation</h4>
                  </div>
                  <p className="text-xs text-[#3D262A] font-medium leading-relaxed pl-11">
                    Rohma reviews your spatial dimensions, lighting, and palette preferences to establish initial concepts and custom canvas dimensions.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-brook/20 p-4 rounded-xl border border-pomelo/40 space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amaranth text-chalk flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                      <Palette className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-amaranth uppercase tracking-wider">02. Studio Creation & Milestones</h4>
                  </div>
                  <p className="text-xs text-[#3D262A] font-medium leading-relaxed pl-11">
                    A 1–2 week period of dedicated studio creation. High-resolution progress updates are shared at key milestones before final varnish.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-brook/20 p-4 rounded-xl border border-pomelo/40 space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amaranth text-chalk flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-amaranth uppercase tracking-wider">03. Installation</h4>
                  </div>
                  <p className="text-xs text-[#3D262A] font-medium leading-relaxed pl-11">
                    Custom packing and guidance on framing and wall installation.
                  </p>
                </div>
              </div>
            </div>

            {/* Studio Availability Banner at Bottom of Right Column */}
            <div className={`p-5 rounded-xl border-2 flex items-start space-x-3 shadow-xs ${
              commissionsOpen
                ? 'bg-thulian text-chalk border-pomelo'
                : 'bg-thulian/30 text-amaranth border-thulian/60'
            }`}>
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase block px-2 py-0.5 rounded inline-block ${
                  commissionsOpen ? 'bg-amaranth text-chalk' : 'bg-thulian text-chalk'
                }`}>
                  {commissionsOpen ? 'STUDIO STATUS: BOOKING OPEN' : 'STUDIO STATUS: COMMISSIONS CLOSED'}
                </span>
                <p className="text-xs font-bold pt-1.5">
                  {commissionsOpen
                    ? 'Accepting limited custom commissions for upcoming seasonal delivery. Submit your inquiry to hold your spot.'
                    : 'Studio bookings are currently paused. Submit your inquiry to join the priority notification list.'
                  }
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
