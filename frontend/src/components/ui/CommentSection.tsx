import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Edit2,
  Trash2,
  Reply,
  Crown,
  Shield,
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, commentsAPI } from '../../utils/api';
import { Comment, User } from '../../types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommentSectionProps {
  documentId: string;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUser: User;
  canModerate?: boolean;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onSubmitReply: (parentId: string, content: string) => Promise<void>;
  replyingTo: string | null;
  submittingReply: boolean;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  canModerate = false,
  onReply,
  onEdit,
  onDelete,
  onSubmitReply,
  replyingTo,
  submittingReply,
  depth = 0
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [canReplyToComment, setCanReplyToComment] = useState(true);
  const [replyRestrictionReason, setReplyRestrictionReason] = useState<string>('');
  
  const isOwner = comment.userId === currentUser.id;
  const isProfessor = comment.user.role === 'professeur';
  const isAdmin = comment.user.role === 'admin';
  const canEditOrDelete = isOwner || canModerate;
  const isReplying = replyingTo === comment.id;

  // Check reply permissions when component mounts or user role changes
  useEffect(() => {
    const checkReplyPermissions = async () => {
      // Professors and admins can always reply
      if (currentUser.role === 'professeur' || currentUser.role === 'admin') {
        setCanReplyToComment(true);
        return;
      }

      // Students need permission check
      if (currentUser.role === 'etudiant') {
        try {
          const response = await commentsAPI.checkReplyPermission(comment.id);
          setCanReplyToComment(response.data.canReply);
          setReplyRestrictionReason(response.data.reason || '');
        } catch (error) {
          console.error('Error checking reply permissions:', error);
          setCanReplyToComment(false);
          setReplyRestrictionReason('Erreur lors de la vérification des permissions');
        }
      }
    };

    checkReplyPermissions();
  }, [comment.id, currentUser.role]);

  // If comment is deleted, show deletion message
  if (comment.isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${depth > 0 ? `ml-${Math.min(depth * 8, 32)} pl-4 border-l-2 border-gray-200` : ''} mb-4`}
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm italic">
              Ce commentaire a été supprimé
              {comment.deletedBy === comment.userId 
                ? " par l'utilisateur" 
                : " par un modérateur"
              }
              {comment.deletedAt && (
                <span className="ml-1">
                  il y a {formatDistanceToNow(new Date(comment.deletedAt), { 
                    addSuffix: false, 
                    locale: fr 
                  })}
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* Still show replies even if parent is deleted */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                canModerate={canModerate}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onSubmitReply={onSubmitReply}
                replyingTo={replyingTo}
                submittingReply={submittingReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  const handleSubmitInlineReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await onSubmitReply(comment.id, replyContent);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleCancelReply = () => {
    onReply(''); // Clear the reply state
    setReplyContent('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${depth > 0 ? `ml-${Math.min(depth * 8, 32)} pl-4 border-l-2 border-gray-300` : ''} mb-4`}
    >
      <div className={`bg-white border rounded-lg p-4 shadow-sm ${
        isProfessor ? 'border-blue-200 bg-blue-50/30' : 
        isAdmin ? 'border-yellow-200 bg-yellow-50/30' : 
        'border-gray-200'
      } ${depth > 0 ? 'bg-gray-50/50' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                isProfessor ? 'bg-blue-500' : 
                isAdmin ? 'bg-yellow-500' : 
                'bg-gray-500'
              }`}>
                <span className="text-white font-medium text-xs">
                  {(comment.user.prenom || '').charAt(0)}{(comment.user.nom || '').charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {comment.user.prenom} {comment.user.nom}
                  </span>
                  {isProfessor && (
                    <div title="Enseignant(e)">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  {isAdmin && (
                    <div title="Administrateur">
                      <Crown className="w-4 h-4 text-yellow-600" />
                    </div>
                  )}
                  {depth > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      Réponse
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-gray-400 italic">(modifié)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.contenu}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 text-sm">
          {canReplyToComment ? (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Reply className="w-4 h-4" />
              Répondre
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-400">
                <Reply className="w-4 h-4" />
                <span>Répondre</span>
              </div>
              {replyRestrictionReason && (
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center cursor-help">
                    <span className="text-orange-600 text-xs">!</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {replyRestrictionReason}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {canEditOrDelete && (
            <>
              <button
                onClick={() => onEdit(comment)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 ml-4 pl-4 border-l-2 border-blue-300"
        >
          <form onSubmit={handleSubmitInlineReply} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 text-sm mb-3">
              <Reply className="w-4 h-4" />
              <span className="font-medium">
                Réponse à {comment.user.prenom} {comment.user.nom}
              </span>
            </div>
            
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none mb-3"
              rows={3}
              disabled={submittingReply}
              autoFocus
            />
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {submittingReply ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submittingReply ? 'Envoi...' : 'Répondre'}
              </button>
              
              <button
                type="button"
                onClick={handleCancelReply}
                className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              canModerate={canModerate}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmitReply={onSubmitReply}
              replyingTo={replyingTo}
              submittingReply={submittingReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  documentId,
  className = ''
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [canModerate, setCanModerate] = useState(false);

  // Function to recursively count all comments including nested replies
  const countAllComments = (comments: Comment[]): number => {
    let count = 0;
    for (const comment of comments) {
      if (!comment.isDeleted) {
        count += 1;
        if (comment.replies && comment.replies.length > 0) {
          count += countAllComments(comment.replies);
        }
      }
    }
    return count;
  };

  const totalCommentCount = countAllComments(comments);

  const fetchComments = useCallback(async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const response = await documentsAPI.getDocumentComments(documentId);
      setComments(response.data || []);
      setCanModerate(response.canModerate || false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      await documentsAPI.createComment(documentId, {
        contenu: newComment,
        parentId: undefined // Only top-level comments from main form
      });
      
      setNewComment('');
      await fetchComments();
      toast.success('Commentaire ajouté avec succès');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitInlineReply = async (parentId: string, content: string) => {
    if (!content.trim() || !user) return;

    setSubmitting(true);
    try {
      await documentsAPI.createComment(documentId, {
        contenu: content,
        parentId: parentId
      });
      
      setReplyTo(null); // Clear reply state
      await fetchComments();
      toast.success('Réponse ajoutée avec succès');
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Erreur lors de l\'ajout de la réponse');
      throw error; // Re-throw to handle in component
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (comment: Comment) => {
    if (!editContent.trim()) return;

    try {
      await commentsAPI.updateComment(comment.id, {
        contenu: editContent
      });
      
      setEditingComment(null);
      setEditContent('');
      await fetchComments();
      toast.success('Commentaire modifié avec succès');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Erreur lors de la modification du commentaire');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      await commentsAPI.deleteComment(commentId);
      await fetchComments();
      toast.success('Commentaire supprimé avec succès');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erreur lors de la suppression du commentaire');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.contenu);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Connectez-vous pour voir et ajouter des commentaires</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Commentaires ({totalCommentCount})
          </h3>
        </div>

        {/* Conversation Rules Info for Students */}
        {user.role === 'etudiant' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-medium">i</span>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Règles de conversation :</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Vous pouvez commenter librement sur les documents</li>
                  <li>• Vous pouvez répondre aux enseignants et administrateurs</li>
                  <li>• Attendez une réponse de l'enseignant avant de répondre à nouveau</li>
                  <li>• Vous ne pouvez pas répondre aux autres étudiants</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre commentaire..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={submitting}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canModerate && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span>Modérateur</span>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Envoi...' : 'Publier'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Chargement des commentaires...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm">Soyez le premier à commenter !</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {comments
                .filter(comment => !comment.parentId) // Only show top-level comments
                .map((comment) => (
                  <div key={comment.id}>
                    {editingComment?.id === comment.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Edit2 className="w-4 h-4" />
                            <span>Modification du commentaire</span>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                            rows={3}
                            placeholder="Modifiez votre commentaire..."
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment)}
                              disabled={!editContent.trim()}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Sauvegarder
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <CommentItem
                        comment={comment}
                        currentUser={user}
                        canModerate={canModerate}
                        onReply={(parentId) => setReplyTo(parentId)}
                        onEdit={(comment) => startEdit(comment)}
                        onDelete={(commentId) => handleDeleteComment(commentId)}
                        onSubmitReply={handleSubmitInlineReply}
                        replyingTo={replyTo}
                        submittingReply={submitting}
                      />
                    )}
                  </div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 