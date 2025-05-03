'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

type Snack = {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
};

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [mySnacks, setMySnacks] = useState<Snack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const snackListRef = useRef<HTMLDivElement>(null);

  const fetchMySnacks = async () => {
    try {
      const res = await fetch('/api/snacks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMySnacks(data);
        setError(null);
      } else {
        setError(data.error || 'Unknown error');
        setMySnacks([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load snacks');
    }
  };

  useEffect(() => {
    fetchMySnacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    try {
      const res = await fetch('/api/snacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, location, imageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Snack uploaded!');
        setName('');
        setDescription('');
        setLocation('');
        setImageUrl('');
        fetchMySnacks();
        setTimeout(() => {
          snackListRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
    setUploading(true);
    setError(null);
    setMessage('');

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        setError('Missing Cloudinary config. Check .env.local');
        return;
      }
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) {
        setError('Upload failed: Cloudinary did not return secure_url');
        return;
      }
      setImageUrl(data.secure_url);
      setMessage('Image uploaded!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Image upload failed. See console for details.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (snackId: string) => {
    try {
      const res = await fetch(`/api/snacks/${snackId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMySnacks(mySnacks.filter(snack => snack.id !== snackId));
        setMessage('Snack deleted successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete snack');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete snack');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen">
        <nav className="w-full bg-white shadow p-4 flex justify-between items-center border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-amber-600 flex items-center gap-2">Snack Swap <span className="text-2xl">🍪</span></h1>
          </div>
          <div className="space-x-6 text-sm">
            <a href="/swapsnack/feed" className="text-amber-600/70 hover:text-amber-600">Feed</a>
            <a href="/swapsnack/profile" className="font-bold text-amber-600">My Snacks</a>
            <a href="/swapsnack/matches" className="text-amber-600/70 hover:text-amber-600">Matches</a>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto mt-10">
          {/* Upload Form */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-md p-6 border border-amber-400">
              <h3 className="text-lg font-semibold mb-4 text-black">Upload a Snack</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Snack Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                    required
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 p-2 rounded-md min-h-[100px] text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />

                <div className="flex flex-col gap-4">
                  <div className="flex justify-center">
                    <label className="cursor-pointer bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition w-full text-center">
                      Select Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  {uploading && <p className="text-sm text-gray-500 text-center">Uploading image...</p>}
                  {!imageUrl && !uploading && (
                    <p className="text-sm text-gray-500 text-center">Please upload an image before submitting.</p>
                  )}
                  {imageUrl && (
                    <div className="flex justify-center">
                      <img src={imageUrl} alt="Preview" className="w-40 h-40 object-cover rounded-lg border border-gray-200 mt-2" />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="bg-amber-500 text-white hover:bg-amber-600"
                  disabled={!imageUrl || uploading}
                >
                  Upload
                </Button>
              </form>
              {message && <p className="text-sm mt-2 text-green-600 text-center">{message}</p>}
              {error && <p className="text-sm mt-2 text-red-500 text-center">{error}</p>}
            </div>
          </section>

          {/* Snack Gallery */}
          <section ref={snackListRef}>
            <div className="bg-white rounded-xl shadow-md p-6 border border-amber-400">
              <h3 className="text-lg font-semibold mb-6 text-black">Your Uploaded Snacks</h3>
              {error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : mySnacks.length === 0 ? (
                <p className="text-gray-500 text-center">No snacks uploaded yet.</p>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {mySnacks.map((snack) => (
                    <div key={snack.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition border border-gray-200">
                      <img src={snack.imageUrl} alt={snack.name} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-black">{snack.name}</h3>
                        <p className="text-sm text-gray-600">{snack.location}</p>
                        <div className="flex justify-between items-end mt-2">
                          <p className="text-sm text-black">{snack.description}</p>
                          <button
                            onClick={() => handleDelete(snack.id)}
                            className="bg-amber-500 text-white py-1 px-3 rounded-md hover:bg-amber-600 transition text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}




