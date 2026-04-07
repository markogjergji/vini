import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserX, Store, Trash2, ExternalLink } from "lucide-react";
import {
  getAdminUsers,
  updateUser,
  deleteUser,
  makeUserSeller,
  revokeUserSeller,
} from "../../api/admin";
import type { User } from "../../types";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  seller: "bg-emerald-100 text-emerald-700",
  user: "bg-gray-100 text-gray-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(user: User) {
    setActionId(user.id);
    await updateUser(user.id, { is_active: !user.is_active });
    await load();
    setActionId(null);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setActionId(user.id);
    await deleteUser(user.id);
    await load();
    setActionId(null);
  }

  async function handleMakeSeller(user: User) {
    setActionId(user.id);
    await makeUserSeller(user.id, { name: user.full_name });
    await load();
    setActionId(null);
  }

  async function handleRevokeSeller(user: User) {
    if (!confirm(`Revoke seller role from "${user.username}"?`)) return;
    setActionId(user.id);
    await revokeUserSeller(user.id);
    await load();
    setActionId(null);
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">User</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Shop</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-gray-500 text-xs">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.seller_id ? (
                    <button
                      onClick={() => navigate(`/admin/sellers?id=${u.seller_id}`)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Store size={13} />
                      View Shop
                      <ExternalLink size={11} />
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {u.role !== "admin" && (
                      <>
                        {u.role === "seller" ? (
                          <button
                            title="Revoke seller"
                            onClick={() => handleRevokeSeller(u)}
                            disabled={actionId === u.id}
                            className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 disabled:opacity-40 transition-colors"
                          >
                            <Store size={15} />
                          </button>
                        ) : (
                          <button
                            title="Make seller"
                            onClick={() => handleMakeSeller(u)}
                            disabled={actionId === u.id}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                          >
                            <Store size={15} />
                          </button>
                        )}
                        <button
                          title={u.is_active ? "Disable user" : "Enable user"}
                          onClick={() => toggleActive(u)}
                          disabled={actionId === u.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                        >
                          <UserX size={15} />
                        </button>
                        <button
                          title="Delete user"
                          onClick={() => handleDelete(u)}
                          disabled={actionId === u.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
