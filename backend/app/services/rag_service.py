"""
Sports Science & Historical Vector RAG Service
Powered by persistent ChromaDB and local ONNX embeddings.
Indexes peer-reviewed exercise physiology and biomechanics literature,
as well as user personal workout and nutrition history.
"""

import os
import glob
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings

# Persistent storage directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VECTOR_DB_DIR = os.path.join(BASE_DIR, "data", "vector_db")
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, "data", "knowledge_base")

os.makedirs(VECTOR_DB_DIR, exist_ok=True)
os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)

class SportsScienceRAG:
    """
    High-performance vector RAG engine for sports science literature
    and personalized workout memory.
    """

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=VECTOR_DB_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        self.sports_coll = self.client.get_or_create_collection(
            name="sports_science",
            metadata={"hnsw:space": "cosine"}
        )
        self.user_history_coll = self.client.get_or_create_collection(
            name="user_fitness_history",
            metadata={"hnsw:space": "cosine"}
        )
        self._ensure_knowledge_base_indexed()

    def _ensure_knowledge_base_indexed(self):
        """
        Scans backend/data/knowledge_base/*.md and indexes documents if not already populated.
        """
        try:
            if self.sports_coll.count() > 0:
                return

            md_files = glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, "*.md"))
            if not md_files:
                return

            doc_ids = []
            documents = []
            metadatas = []

            for file_path in md_files:
                filename = os.path.basename(file_path)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Parse document title and sections
                lines = content.split("\n")
                title = filename.replace(".md", "").replace("_", " ").title()
                for line in lines:
                    if line.startswith("# "):
                        title = line.replace("# ", "").strip()
                        break

                # Split by primary markdown sections (## )
                sections = content.split("\n## ")
                for idx, sec in enumerate(sections):
                    chunk_text = sec.strip()
                    if not chunk_text:
                        continue
                    if idx > 0:
                        chunk_text = "## " + chunk_text

                    # Create chunk summary from first lines
                    summary_lines = [l for l in chunk_text.split("\n") if l.strip() and not l.startswith("#")]
                    summary = summary_lines[0][:140] if summary_lines else title

                    chunk_id = f"{filename}_{idx}"
                    doc_ids.append(chunk_id)
                    documents.append(chunk_text)
                    metadatas.append({
                        "source": filename,
                        "title": title,
                        "section_index": idx,
                        "summary": summary
                    })

            if documents:
                self.sports_coll.add(
                    ids=doc_ids,
                    documents=documents,
                    metadatas=metadatas
                )
        except Exception as e:
            print(f"[RAG Init Warning] Could not index knowledge base: {e}")

    def retrieve_evidence(self, query: str, user_id: Optional[str] = None, n_results: int = 2) -> Dict[str, Any]:
        """
        Performs semantic vector search against sports science literature.
        Returns:
            {
                "rag_context": str (for LLM prompt injection),
                "evidence_cards": List[dict] (for UI evidence pill display)
            }
        """
        evidence_cards = []
        context_parts = []

        try:
            results = self.sports_coll.query(
                query_texts=[query],
                n_results=min(n_results, max(1, self.sports_coll.count()))
            )

            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                dists = results["distances"][0] if results.get("distances") else [0.2] * len(docs)

                for doc, meta, dist in zip(docs, metas, dists):
                    relevance = max(0.5, round(1.0 - float(dist), 2)) if dist is not None else 0.85
                    title = meta.get("title", "Sports Science Reference")
                    source = meta.get("source", "Peer-reviewed literature")
                    summary = meta.get("summary", doc[:120])

                    context_parts.append(f"--- [REFERENCE: {title} ({source})] ---\n{doc}")
                    evidence_cards.append({
                        "id": meta.get("source", "ref").replace(".md", ""),
                        "title": title,
                        "summary": summary,
                        "source": source,
                        "relevance": relevance
                    })

            # If user_id is provided, also search personal workout/macro history
            if user_id and self.user_history_coll.count() > 0:
                user_res = self.user_history_coll.query(
                    query_texts=[query],
                    where={"user_id": user_id},
                    n_results=1
                )
                if user_res and user_res.get("documents") and len(user_res["documents"]) > 0 and user_res["documents"][0]:
                    user_doc = user_res["documents"][0][0]
                    context_parts.append(f"--- [USER PERSONAL HISTORY] ---\n{user_doc}")

        except Exception as e:
            print(f"[RAG Retrieval Warning] {e}")

        rag_context = "\n\n".join(context_parts) if context_parts else ""

        return {
            "rag_context": rag_context,
            "evidence_cards": evidence_cards
        }

    def index_user_log(self, user_id: str, entry_id: str, content: str, entry_type: str = "workout") -> bool:
        """
        Indexes a user workout, meal, or recovery entry into personal history collection.
        """
        try:
            self.user_history_coll.upsert(
                ids=[f"{user_id}_{entry_id}"],
                documents=[content],
                metadatas=[{"user_id": user_id, "type": entry_type}]
            )
            return True
        except Exception as e:
            print(f"[RAG User Index Warning] {e}")
            return False

# Global singleton RAG instance
sports_rag = SportsScienceRAG()
