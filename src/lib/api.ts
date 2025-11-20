// ... existing code ...

export interface Attachment {
  id: number;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  file_path: string;
  note_id: number;
  created_at: string;
}

// ... existing code ...

// Attachments API
export const attachmentsApi = {
  list: async (noteId: number) => {
    const response = await api.get(`/attachments/notes/${noteId}`);
    return response.data;
  },

  upload: async (noteId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/attachments/notes/${noteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  download: async (attachmentId: number) => {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (attachmentId: number) => {
    await api.delete(`/attachments/${attachmentId}`);
  },
};
