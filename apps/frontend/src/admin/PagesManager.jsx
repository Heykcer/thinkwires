import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminApi } from './adminService';
import VisualSectionEditor from './VisualSectionEditor';
import { getAllIndustries } from '../store/slices/industriesSlice';
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  AlertCircleIcon,
  PaletteIcon,
  FileTextIcon,
  CodeIcon,
  InfoIcon,
} from './AdminIcons';

const PagesManager = () => {
  const { showToast, activeRole } = useOutletContext();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('visual'); // 'visual', 'general', 'json'

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Core Website',
    content: '',
    data: {},
    dataJson: '{}',
    metaTitle: '',
    metaDescription: '',
    status: 'published',
  });

  const [formError, setFormError] = useState('');

  const fetchPages = () => {
    setLoading(true);
    adminApi
      .getCmsPages()
      .then((res) => {
        const existingPages = res.pages || [];
        const industryDefaults = getAllIndustries()
          .map((ind) => {
            const pageSlug = `industries/${ind.slug}`;
            const existing = existingPages.find(
              (p) => p.slug === pageSlug || p.slug === ind.slug
            );
            if (existing) return null;
            return {
              _id: `default-${ind.slug}`,
              title: ind.title,
              slug: pageSlug,
              category: 'Industry Sectors',
              data: ind,
              metaTitle: `${ind.title} | Thinkwires`,
              metaDescription: ind.shortDesc || '',
              status: 'published',
              isSystemDefault: true,
            };
          })
          .filter(Boolean);

        setPages([...existingPages, ...industryDefaults]);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showToast(`Failed to load CMS pages: ${err.message}`);
      });
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openAddModal = () => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot create pages.');
      return;
    }
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Solutions Page',
      content: 'Enter markdown or HTML content here...',
      data: {},
      dataJson: '{}',
      metaTitle: '',
      metaDescription: '',
      status: 'draft',
    });
    setFormError('');
    setActiveModalTab('general');
    setEditorOpen(true);
  };

  const openEditModal = (pg) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot edit pages.');
      return;
    }
    setEditingPage(pg);
    const initialData = pg.data || {};
    setFormData({
      title: pg.title || '',
      slug: pg.slug || '',
      category: pg.category || 'Core Website',
      content: pg.content || '',
      data: initialData,
      dataJson: JSON.stringify(initialData, null, 2),
      metaTitle: pg.metaTitle || '',
      metaDescription: pg.metaDescription || '',
      status: pg.status || 'published',
    });
    setFormError('');
    setActiveModalTab(
      Object.keys(initialData).length > 0 ? 'visual' : 'general'
    );
    setEditorOpen(true);
  };

  const handleTogglePublish = (id) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot change publication status.');
      return;
    }
    adminApi
      .togglePublishCmsPage(id)
      .then((res) => {
        showToast(`Page is now ${res.status}`);
        fetchPages();
      })
      .catch((err) => showToast(`Status toggle failed: ${err.message}`));
  };

  const handleVisualDataChange = (newData) => {
    setFormData((prev) => ({
      ...prev,
      data: newData,
      dataJson: JSON.stringify(newData, null, 2),
    }));
  };

  const handleJsonDataChange = (newJson) => {
    let parsed = null;
    try {
      parsed = JSON.parse(newJson);
    } catch {
      // Ignore invalid JSON while user is actively typing
    }
    setFormData((prev) => ({
      ...prev,
      dataJson: newJson,
      data: parsed !== null ? parsed : prev.data,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      setFormError('Title and URL Slug are required.');
      return;
    }

    let finalData = formData.data;
    if (
      activeModalTab === 'json' &&
      formData.dataJson &&
      formData.dataJson.trim()
    ) {
      try {
        finalData = JSON.parse(formData.dataJson);
      } catch (err) {
        setFormError(`Invalid JSON in Developer JSON tab: ${err.message}`);
        return;
      }
    }

    const payload = {
      title: formData.title,
      slug: formData.slug,
      category: formData.category,
      content:
        formData.content || 'Content configured via Visual Section Editor.',
      data: finalData || {},
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      status: formData.status,
    };

    if (editingPage && !editingPage.isSystemDefault) {
      adminApi
        .updateCmsPage(editingPage.id || editingPage._id, payload)
        .then(() => {
          showToast(`Page '${formData.title}' updated successfully.`);
          setEditorOpen(false);
          fetchPages();
        })
        .catch((err) => setFormError(err.message));
    } else {
      adminApi
        .createCmsPage(payload)
        .then(() => {
          showToast(`Page '${formData.title}' saved to database successfully.`);
          setEditorOpen(false);
          fetchPages();
        })
        .catch((err) => setFormError(err.message));
    }
  };

  const handleDelete = (id) => {
    if (activeRole === 'viewer') {
      showToast('Viewer accounts cannot delete pages.');
      return;
    }
    adminApi
      .deleteCmsPage(id)
      .then(() => {
        showToast('Page deleted permanently.');
        setDeleteConfirmId(null);
        fetchPages();
      })
      .catch((err) => showToast(`Delete failed: ${err.message}`));
  };

  return (
    <div>
      <div className="tw-view-header">
        <div className="tw-view-title-group">
          <h1>Website Pages Management</h1>
          <p className="tw-view-subtitle">
            Manage page content, URL slugs, publication statuses, SEO meta
            properties, and live web previews.
          </p>
        </div>

        <button className="tw-btn-primary" onClick={openAddModal}>
          <PlusIcon size={15} />
          <span>Create New Page</span>
        </button>
      </div>

      <div className="tw-table-container">
        <div className="tw-table-toolbar">
          <h2 className="tw-card-title">All Website Pages ({pages.length})</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Instant publishing engine connected to Thinkwires routes
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tw-table">
            <thead>
              <tr>
                <th>Page Title</th>
                <th>URL Slug</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Updated By</th>
                <th>Published Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748B',
                    }}
                  >
                    Loading pages...
                  </td>
                </tr>
              ) : (
                pages.map((pg) => (
                  <tr key={pg.id || pg._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pg.title}</div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#64748B',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pg.content}
                      </div>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#F1F5F9',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        /{pg.slug}
                      </code>
                    </td>
                    <td>{pg.category}</td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(pg.id || pg._id)}
                        className={`tw-badge ${pg.status.toLowerCase()}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Click to toggle Draft / Published"
                      >
                        {pg.status === 'published' ? '● Published' : '○ Draft'}
                      </button>
                    </td>
                    <td>{pg.lastUpdatedBy || 'Admin'}</td>
                    <td>
                      {pg.publishedAt
                        ? new Date(pg.publishedAt).toLocaleDateString()
                        : 'Unpublished'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className="tw-action-btn-group"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <button
                          className="tw-action-icon-btn"
                          onClick={() => setPreviewPage(pg)}
                          title="Preview Page"
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          className="tw-action-icon-btn"
                          onClick={() => openEditModal(pg)}
                          title="Edit Page"
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          className="tw-action-icon-btn delete"
                          onClick={() => setDeleteConfirmId(pg.id || pg._id)}
                          title="Delete Page"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Preview Modal */}
      {previewPage && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '680px' }}>
            <div className="tw-modal-header">
              <div>
                <span
                  className="tw-badge deployed"
                  style={{ marginBottom: '0.25rem' }}
                >
                  Live Preview: /{previewPage.slug}
                </span>
                <h2 className="tw-modal-title">{previewPage.title}</h2>
              </div>
              <button
                className="tw-modal-close-btn"
                onClick={() => setPreviewPage(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="tw-modal-body">
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748B',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong>Meta Title:</strong>{' '}
                  {previewPage.metaTitle || previewPage.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  <strong>Meta Description:</strong>{' '}
                  {previewPage.metaDescription || 'No description provided.'}
                </div>
              </div>

              <div
                style={{
                  lineHeight: '1.7',
                  fontSize: '0.92rem',
                  color: '#172033',
                  backgroundColor: '#FFFFFF',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              >
                {previewPage.content}
              </div>
            </div>

            <div className="tw-modal-footer">
              <button
                className="tw-btn-secondary"
                onClick={() => setPreviewPage(null)}
              >
                Close Preview
              </button>
              <button
                className="tw-btn-primary"
                onClick={() => {
                  setPreviewPage(null);
                  openEditModal(previewPage);
                }}
              >
                Edit Page Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Page Modal */}
      {editorOpen && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '840px', width: '95%' }}>
            <div className="tw-modal-header">
              <div>
                <h2 className="tw-modal-title" style={{ margin: 0 }}>
                  {editingPage
                    ? `Edit: ${editingPage.title}`
                    : 'Create Website Page'}
                </h2>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  /{formData.slug || 'url-slug'} • {formData.category}
                </span>
              </div>
              <button
                className="tw-modal-close-btn"
                onClick={() => setEditorOpen(false)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModalTab('visual')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    activeModalTab === 'visual' ? '#008F68' : 'transparent',
                  color: activeModalTab === 'visual' ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <PaletteIcon size={15} />
                <span>Visual Sections (No-Code)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    activeModalTab === 'general' ? '#008F68' : 'transparent',
                  color: activeModalTab === 'general' ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <FileTextIcon size={15} />
                <span>Page Info & SEO</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('json')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    activeModalTab === 'json' ? '#008F68' : 'transparent',
                  color: activeModalTab === 'json' ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CodeIcon size={15} />
                <span>Advanced JSON (Dev)</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="tw-modal-body"
                style={{
                  maxHeight: '65vh',
                  overflowY: 'auto',
                  padding: '1.25rem 1.5rem',
                }}
              >
                {formError && (
                  <div
                    style={{
                      padding: '0.65rem 0.9rem',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircleIcon size={16} color="#DC2626" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TAB 1: VISUAL SECTION EDITOR (NO-CODE FOR NON-TECHIES) */}
                {activeModalTab === 'visual' && (
                  <div>
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#E6F4F0',
                        borderRadius: '6px',
                        color: '#006548',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <InfoIcon size={16} color="#006548" />
                      <span>
                        <strong>Visual Form Editor</strong>: Edit headers,
                        comparison points, badges, and metrics below. Changes
                        automatically update the database without writing JSON
                        syntax!
                      </span>
                    </div>

                    <VisualSectionEditor
                      data={formData.data}
                      onChange={handleVisualDataChange}
                    />
                  </div>
                )}

                {/* TAB 2: GENERAL PAGE INFO & SEO */}
                {activeModalTab === 'general' && (
                  <div>
                    <div className="tw-form-row">
                      <div className="tw-form-group">
                        <label className="tw-form-label">Page Title *</label>
                        <input
                          type="text"
                          className="tw-form-input"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="e.g. Industries We Serve"
                          required
                        />
                      </div>
                      <div className="tw-form-group">
                        <label className="tw-form-label">URL Slug *</label>
                        <input
                          type="text"
                          className="tw-form-input"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder="industries"
                          required
                        />
                      </div>
                    </div>

                    <div className="tw-form-row">
                      <div className="tw-form-group">
                        <label className="tw-form-label">Page Category</label>
                        <input
                          type="text"
                          className="tw-form-input"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          placeholder="Core Website / Solutions"
                        />
                      </div>
                      <div className="tw-form-group">
                        <label className="tw-form-label">
                          Publication Status
                        </label>
                        <select
                          className="tw-form-select"
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        Markdown / Summary Copy
                      </label>
                      <textarea
                        className="tw-form-textarea"
                        rows="4"
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="Overview copy or markdown notes for this page..."
                      ></textarea>
                    </div>

                    <div className="tw-form-group">
                      <label className="tw-form-label">SEO Meta Title</label>
                      <input
                        type="text"
                        className="tw-form-input"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaTitle: e.target.value,
                          })
                        }
                        placeholder="Thinkwires — Transforming Global Tech Talent"
                      />
                    </div>

                    <div className="tw-form-group">
                      <label className="tw-form-label">
                        SEO Meta Description
                      </label>
                      <textarea
                        className="tw-form-textarea"
                        rows="2"
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value,
                          })
                        }
                        placeholder="Search engine summary text..."
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* TAB 3: ADVANCED DEVELOPER JSON */}
                {activeModalTab === 'json' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <label className="tw-form-label" style={{ margin: 0 }}>
                        Developer Raw JSON Editor
                      </label>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#008F68',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(
                              JSON.parse(formData.dataJson || '{}'),
                              null,
                              2
                            );
                            setFormData({ ...formData, dataJson: formatted });
                            showToast('Formatted JSON payload.');
                          } catch (e) {
                            setFormError(`Cannot format: ${e.message}`);
                          }
                        }}
                      >
                        Format JSON
                      </button>
                    </div>
                    <textarea
                      className="tw-form-textarea"
                      rows="14"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        backgroundColor: '#F8FAFC',
                      }}
                      value={formData.dataJson}
                      onChange={(e) => handleJsonDataChange(e.target.value)}
                    ></textarea>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Raw representation of page sections. Edits here
                      synchronize with the Visual Editor.
                    </span>
                  </div>
                )}
              </div>

              <div className="tw-modal-footer">
                <button
                  type="button"
                  className="tw-btn-secondary"
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="tw-btn-primary">
                  {editingPage ? 'Save Changes' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="tw-modal-overlay">
          <div className="tw-modal" style={{ maxWidth: '440px' }}>
            <div className="tw-modal-header">
              <h2 className="tw-modal-title">Delete Page</h2>
              <button
                className="tw-modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="tw-modal-body">
              Are you sure you want to permanently delete this page? This will
              remove its route mapping and SEO index metadata.
            </div>
            <div className="tw-modal-footer">
              <button
                className="tw-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="tw-btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesManager;
