"use client";

import React, { useMemo } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { User, Heart, Baby, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  dateOfBirth?: Date | string | null;
  role?: string;
}

interface FamilyTreeProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    profileImage?: string | null;
    dateOfBirth?: Date | string | null;
    role?: string;
  };
  spouse?: FamilyMember | null;
  parent?: FamilyMember | null;
  children?: FamilyMember[];
}

interface TreeNode {
  id: string;
  name: string;
  title: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  dateOfBirth?: Date | string | null;
  role?: string;
  children?: TreeNode[];
}

function FamilyNode({ node, isSpouse = false, isPlaceholder = false }: { node: TreeNode; isSpouse?: boolean; isPlaceholder?: boolean }) {
  const initials = node.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "PASTOR":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "LEADER":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "MEMBER":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const calculateAge = (dateOfBirth?: Date | string | null) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(node.dateOfBirth);

  if (isPlaceholder) {
    return (
      <div className="w-48 p-3 opacity-0 pointer-events-none">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-transparent" />
        </div>
      </div>
    );
  }

  return (
    <Link href={`/dashboard/people/${node.id}`} className="block">
      <Card className={`w-48 p-3 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 ${
        isSpouse 
          ? "border-pink-300 dark:border-pink-700 hover:border-pink-500 dark:hover:border-pink-500 bg-pink-50/50 dark:bg-pink-950/20" 
          : "border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800"
      }`}>
        <div className="flex flex-col items-center text-center space-y-2">
          {node.profileImage ? (
            <div className="relative">
              <img
                src={node.profileImage}
                alt={node.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-md"
              />
              {isSpouse && (
                <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                  <Heart className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl border-2 shadow-md ${getRoleColor(node.role)}`}
              >
                {initials}
              </div>
              {isSpouse && (
                <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                  <Heart className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          )}
          <div className="w-full space-y-1">
            <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{node.name}</p>
            {node.role && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getRoleColor(node.role)} border`}
              >
                {node.role}
              </Badge>
            )}
            {node.dateOfBirth && (
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(node.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {age !== null && (
                  <span className="text-gray-400 dark:text-gray-500">• {age} yrs</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function FamilyTree({ member, spouse, parent, children = [] }: FamilyTreeProps) {
  const treeData = useMemo<TreeNode | null>(() => {
    // Build root node
    const rootNode: TreeNode = {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      title: member.role || "Member",
      email: member.email,
      phone: member.phone,
      profileImage: member.profileImage,
      dateOfBirth: member.dateOfBirth,
      role: member.role,
      children: [],
    };

    // Build spouse node if exists
    const spouseNode = spouse ? {
      id: spouse.id,
      name: `${spouse.firstName} ${spouse.lastName}`,
      title: spouse.role || "Member",
      email: spouse.email,
      phone: spouse.phone,
      profileImage: spouse.profileImage,
      dateOfBirth: spouse.dateOfBirth,
      role: spouse.role,
    } : null;

    // Build children nodes
    const childrenNodes: TreeNode[] = children.map((child) => ({
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      title: child.role || "Member",
      email: child.email,
      phone: child.phone,
      profileImage: child.profileImage,
      dateOfBirth: child.dateOfBirth,
      role: child.role,
    }));

    // Build parent node if exists
    const parentNode = parent ? {
      id: parent.id,
      name: `${parent.firstName} ${parent.lastName}`,
      title: parent.role || "Member",
      email: parent.email,
      phone: parent.phone,
      profileImage: parent.profileImage,
      dateOfBirth: parent.dateOfBirth,
      role: parent.role,
    } : null;

    // Structure: Parent -> (Member + Spouse) -> Children
    if (parentNode) {
      // If there's a parent, create a couple node for member and spouse
      if (spouseNode) {
        const coupleNode: TreeNode = {
          id: `couple-${member.id}`,
          name: `${member.firstName} & ${spouse.firstName}`,
          title: "Couple",
          children: [rootNode, spouseNode],
        };
        
        // Add children to the couple
        if (childrenNodes.length > 0) {
          coupleNode.children = [...coupleNode.children!, ...childrenNodes];
        }

        return {
          ...parentNode,
          children: [coupleNode],
        };
      } else {
        // No spouse, just member under parent
        if (childrenNodes.length > 0) {
          rootNode.children = childrenNodes;
        }
        return {
          ...parentNode,
          children: [rootNode],
        };
      }
    } else {
      // No parent - show member and spouse as root level
      if (spouseNode) {
        const coupleNode: TreeNode = {
          id: `couple-${member.id}`,
          name: `${member.firstName} & ${spouse.firstName}`,
          title: "Family",
          children: [rootNode, spouseNode],
        };
        
        // Add children
        if (childrenNodes.length > 0) {
          coupleNode.children = [...coupleNode.children!, ...childrenNodes];
        }
        
        return coupleNode;
      } else {
        // No spouse, just member
        if (childrenNodes.length > 0) {
          rootNode.children = childrenNodes;
        }
        return rootNode;
      }
    }
  }, [member, spouse, parent, children]);

  if (!treeData) {
    return (
      <div className="w-full p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No family members to display</p>
          <p className="text-sm">Add family members to see the family tree</p>
        </div>
      </div>
    );
  }

  const renderTree = (node: TreeNode, isSpouse = false): React.ReactNode => {
    // Check if this is a couple node (has both member and spouse as children)
    const isCoupleNode = node.id?.startsWith('couple-') && node.children && node.children.length >= 2;
    
    if (isCoupleNode && node.children) {
      // Render couple side by side
      const [memberNode, spouseNode, ...childNodes] = node.children;
      const isMemberSpouse = node.children[0]?.id === member.id;
      
      return (
        <React.Fragment key={node.id}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <FamilyNode node={memberNode} isSpouse={false} />
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <FamilyNode node={spouseNode} isSpouse={true} />
          </div>
          {childNodes.length > 0 && (
            <div className="flex items-start justify-center gap-2 flex-wrap mt-4">
              {childNodes.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <FamilyNode node={child} />
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      );
    }

    // Regular tree node
    return (
      <TreeNode key={node.id} label={<FamilyNode node={node} isSpouse={isSpouse} />}>
        {node.children?.map((child, index) => {
          // Check if this child is a spouse (second child in a couple)
          const childIsSpouse = index === 1 && node.children && node.children.length === 2 && 
                                node.children[0]?.id === member.id;
          return (
            <React.Fragment key={child.id}>
              {renderTree(child, childIsSpouse)}
            </React.Fragment>
          );
        })}
      </TreeNode>
    );
  };

  // Check if root is a couple node
  const isRootCouple = treeData.id?.startsWith('couple-') && treeData.children && treeData.children.length >= 2;

  return (
    <div className="w-full overflow-auto p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[500px]">
      {isRootCouple && treeData.children ? (
        // Render couple at root level
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <FamilyNode node={treeData.children[0]} isSpouse={false} />
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-pink-500 animate-pulse" />
            </div>
            <FamilyNode node={treeData.children[1]} isSpouse={true} />
          </div>
          {treeData.children.length > 2 && (
            <div className="mt-8">
              <div className="flex items-center justify-center mb-4">
                <div className="h-px bg-gray-300 dark:bg-gray-600 w-32"></div>
                <Baby className="w-5 h-5 mx-2 text-gray-400" />
                <div className="h-px bg-gray-300 dark:bg-gray-600 w-32"></div>
              </div>
              <div className="flex items-start justify-center gap-4 flex-wrap">
                {treeData.children.slice(2).map((child) => (
                  <FamilyNode key={child.id} node={child} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Tree
          label={<FamilyNode node={treeData} />}
          lineWidth="3px"
          lineColor="#cbd5e1"
          lineBorderRadius="8px"
          nodePadding="30px"
          lineHeight="40px"
        >
          {treeData.children?.map((child) => (
            <React.Fragment key={child.id}>{renderTree(child)}</React.Fragment>
          ))}
        </Tree>
      )}
    </div>
  );
}

