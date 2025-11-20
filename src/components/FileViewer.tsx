import { useState, useEffect } from 'react';
import { attachmentsApi, type Attachment } from '../lib/api';
import type { AxiosError } from 'axios';

function TextFileViewer({ fileUrl }: { fileUrl: string }) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(fileUrl)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setTextContent(text);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[70vh] p-4 overflow-auto">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
        {textContent || 'Unable to load text content'}
      </pre>
    </div>
  );
}

interface FileViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function FileViewer({ attachment, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (attachment.mime_type?.startsWith('image/')) {
          // For images, we can use the download endpoint directly
          const blob = await attachmentsApi.download(attachment.id);
          const url = window.URL.createObjectURL(blob);
          setFileUrl(url);
        } else {
          // For other files, we'll need to download them
          const blob = await attachmentsApi.download(attachment.id);
          const url = window.URL.createObjectURL(blob);
          setFileUrl(url);
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ detail?: string }>;
        setError(axiosError?.response?.data?.detail || 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();

    // Cleanup URL on unmount
    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl);
      }
    };
  }, [attachment.id, attachment.mime_type]);

  const isImage = attachment.mime_type?.startsWith('image/');
  const isPDF = attachment.mime_type === 'application/pdf';
  const isVideo = attachment.mime_type?.startsWith('video/');
  const isAudio = attachment.mime_type?.startsWith('audio/');
  const isText = attachment.mime_type?.startsWith('text/');

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Unable to load file</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={fileUrl}
            alt={attachment.filename}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={fileUrl}
            title={attachment.filename}
            className="w-full h-full border-0 rounded-lg"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center p-4">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-[70vh] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex items-center justify-center p-8">
          <audio src={fileUrl} controls className="w-full max-w-md">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isText && fileUrl) {
      return <TextFileViewer fileUrl={fileUrl} />;
    }

    // For other file types, show download option
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Preview not available for this file type.
          </p>
          <a
            href={fileUrl}
            download={attachment.filename}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Download File
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 truncate flex-1">
              {attachment.filename}
            </h2>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
